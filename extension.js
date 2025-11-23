import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import GObject from 'gi://GObject';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

const DnsToggle = GObject.registerClass(
class DnsToggle extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'Bastion');
        this._settings = settings;

        // Icons
        this._iconSecure = 'security-high-symbolic';
        this._iconInsecure = 'channel-insecure-symbolic'; 

        this._icon = new St.Icon({
            icon_name: 'network-transmit-receive-symbolic',
            style_class: 'system-status-icon',
        });

        this.add_child(this._icon);

        this.connect('button-press-event', () => {
            this._toggleDNS();
        });

        // Check status immediately and then every 5 seconds
        this._checkStatus();
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
            this._checkStatus();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _onDestroy() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
        super.destroy();
    }

    async _runCommand(command) {
        try {
            let proc = Gio.Subprocess.new(
                ['/bin/sh', '-c', command],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            return new Promise((resolve, reject) => {
                proc.communicate_utf8_async(null, null, (proc, res) => {
                    try {
                        let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                        resolve([proc.get_successful(), stdout, stderr]);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        } catch (e) {
            console.error(e);
            return [false, '', e.toString()];
        }
    }

    async _getActiveUUID() {
        let cmd = 'nmcli -t -f UUID connection show --active | head -n1';
        let [success, out] = await this._runCommand(cmd);
        return success ? out.trim() : null;
    }

    _getDNSIPs() {
        let provider = this._settings.get_string('current-provider');
        const presets = {
            'Google': '8.8.8.8 8.8.4.4',
            'Cloudflare': '1.1.1.1 1.0.0.1',
            'Quad9': '9.9.9.9 149.112.112.112',
            'OpenDNS': '208.67.222.222 208.67.220.220'
        };
        if (provider === 'Custom') {
            let val = this._settings.get_value('custom-dns').deep_unpack();
            return `${val[1]} ${val[2]}`;
        }
        return presets[provider] || presets['Google'];
    }

    async _checkStatus() {
        let uuid = await this._getActiveUUID();
        if (!uuid) {
            this._icon.icon_name = 'network-offline-symbolic';
            return;
        }
        let cmd = `nmcli -f ipv4.ignore-auto-dns connection show ${uuid}`;
        let [success, out] = await this._runCommand(cmd);

        // If yes, we are SECURE. If no, we are LEAKING/LOGIN mode.
        if (success && out.includes('yes')) {
            this._icon.icon_name = this._iconSecure;
        } else {
            this._icon.icon_name = this._iconInsecure;
        }
    }

    async _toggleDNS() {
        let uuid = await this._getActiveUUID();
        if (!uuid) {
            Main.notify('DNS Toggle', 'No active connection found.');
            return;
        }

        let [success, out] = await this._runCommand(`nmcli -f ipv4.ignore-auto-dns connection show ${uuid}`);
        let isSecure = out && out.includes('yes');
        let cmd = '';
        
        if (isSecure) {
            Main.notify('DNS Toggle', '🔓 Switching to Login Mode (ISP DNS Allowed)...');
            // Enable ISP DNS, Clear Manual DNS, Up Interface
            cmd = `pkexec sh -c 'nmcli connection modify ${uuid} ipv4.ignore-auto-dns no ipv4.dns "" && nmcli connection up ${uuid}'`;
        } else {
            let ips = this._getDNSIPs();
            Main.notify('DNS Toggle', '🛡️ Switching to Secure Mode...');
            // Block ISP DNS, Set Secure DNS, Up Interface
            cmd = `pkexec sh -c 'nmcli connection modify ${uuid} ipv4.ignore-auto-dns yes ipv4.dns "${ips}" && nmcli connection up ${uuid}'`;
        }

        await this._runCommand(cmd);
        setTimeout(() => this._checkStatus(), 2000);
    }
});

export default class ExtensionImpl extends Extension {
    enable() {
        this._indicator = new DnsToggle(this.getSettings());
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator._onDestroy();
        this._indicator = null;
    }
}

