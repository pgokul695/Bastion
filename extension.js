import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
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
            this.toggleDNS();
        });

        // Check status immediately
        this._checkStatus();

        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }

        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
            this._checkStatus();
            return GLib.SOURCE_CONTINUE;
        });
    }

    destroy() {
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

        if (success && out.includes('yes')) {
            this._icon.icon_name = this._iconSecure;
        } else {
            this._icon.icon_name = this._iconInsecure;
        }
    }

    async toggleDNS() {
        let uuid = await this._getActiveUUID();
        if (!uuid) {
            Main.notify('Bastion', 'No active connection found.');
            return;
        }

        // Check current state
        let [success, out] = await this._runCommand(`nmcli -f ipv4.ignore-auto-dns connection show ${uuid}`);
        let isCurrentlySecure = out && out.includes('yes');
        
        let useEncryptedDNS_Secure = this._settings.get_boolean('enable-encrypted-dns');
        let useEncryptedDNS_Login = this._settings.get_boolean('enable-encrypted-dns-login');
        let strictMode = this._settings.get_boolean('strict-dns-mode');
        
        let cmd = '';
        
        if (isCurrentlySecure) {
            // --- SWITCH TO LOGIN MODE ---
            // Login mode usually implies we need connectivity (captive portals), so we stick to opportunistic.
            let dotSetting = useEncryptedDNS_Login ? 'opportunistic' : 'no';
            let notifyMsg = useEncryptedDNS_Login ? 
                '🔓 Login Mode (ISP DNS + Encrypted)...' : 
                '🔓 Login Mode (Standard)...';
            
            Main.notify('Bastion', notifyMsg);
            
            cmd = `pkexec sh -c 'nmcli connection modify ${uuid} ipv4.ignore-auto-dns no ipv4.dns "" connection.dns-over-tls ${dotSetting} && nmcli connection up ${uuid}'`;

        } else {
            // --- SWITCH TO SECURE MODE ---
            let ips = this._getDNSIPs();

            // SECURITY FIX: Validate IPs to prevent shell injection
            if (!/^[0-9. ]+$/.test(ips)) {
                Main.notify('Bastion Error', 'Invalid Custom DNS format.');
                return;
            }

            // Determine strictness: 'yes' (Strict) vs 'opportunistic' (Fallback allowed)
            let secureValue = strictMode ? 'yes' : 'opportunistic';
            let dotSetting = useEncryptedDNS_Secure ? secureValue : 'no';
            
            let notifyMsg = '';
            if (useEncryptedDNS_Secure) {
                notifyMsg = strictMode ? '🛡️ Secure Mode (Strict TLS)...' : '🛡️ Secure Mode (Opportunistic TLS)...';
            } else {
                notifyMsg = '🛡️ Secure Mode (Standard DNS)...';
            }

            Main.notify('Bastion', notifyMsg);

            cmd = `pkexec sh -c 'nmcli connection modify ${uuid} ipv4.ignore-auto-dns yes ipv4.dns "${ips}" connection.dns-over-tls ${dotSetting} && nmcli connection up ${uuid}'`;
        }

        await this._runCommand(cmd);
        
        // Wait 2 seconds for connection to cycle, then update icon
        setTimeout(() => this._checkStatus(), 2000);
    }
});

export default class ExtensionImpl extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new DnsToggle(this._settings);
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        Main.wm.addKeybinding(
            'toggle-shortcut',
            this._settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => {
                if (this._indicator) {
                    this._indicator.toggleDNS();
                }
            }
        );
    }

    disable() {
        Main.wm.removeKeybinding('toggle-shortcut');
        
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        this._settings = null;
    }
}
