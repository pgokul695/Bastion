import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class SecureDNSPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'DNS Configuration',
            description: 'Choose which DNS to use when Secure Mode is active.',
        });
        page.add(group);

        // Dropdown List
        const providers = ['Google', 'Cloudflare', 'Quad9', 'OpenDNS', 'Custom'];
        const model = new Gtk.StringList();
        providers.forEach(p => model.append(p));

        const row = new Adw.ComboRow({
            title: 'DNS Provider',
            model: model,
        });
        group.add(row);

        // Bind Dropdown
        const current = settings.get_string('current-provider');
        const idx = providers.indexOf(current);
        if (idx !== -1) row.selected = idx;

        // Custom Inputs Group
        const customGroup = new Adw.PreferencesGroup({
            title: 'Custom DNS IPs',
            visible: (current === 'Custom')
        });
        page.add(customGroup);

        // Visibility Logic
        row.connect('notify::selected', () => {
            const selectedName = providers[row.selected];
            settings.set_string('current-provider', selectedName);
            customGroup.set_visible(selectedName === 'Custom');
        });

        // Custom Fields
        const ip1Entry = new Adw.EntryRow({ title: 'Primary IP' });
        const ip2Entry = new Adw.EntryRow({ title: 'Secondary IP' });
        customGroup.add(ip1Entry);
        customGroup.add(ip2Entry);

        // Load/Save Logic for Custom IPs
        const loadCustom = () => {
            const val = settings.get_value('custom-dns').deep_unpack();
            ip1Entry.text = val[1];
            ip2Entry.text = val[2];
        };
        loadCustom();

        const saveCustom = () => {
            const val = new GLib.Variant('(sss)', ['Custom', ip1Entry.text, ip2Entry.text]);
            settings.set_value('custom-dns', val);
        };

        ip1Entry.connect('apply', saveCustom);
        ip2Entry.connect('apply', saveCustom);
    }
}
