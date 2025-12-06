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

        // --- NEW HELPER: Clickable Popovers ---
        // Instead of tooltips (hover), we use Popovers (click).
        // This is instant and works much better.
        const addInfoButton = (row, text) => {
            // 1. Create the text label
            const label = new Gtk.Label({
                label: text,
                wrap: true,
                max_width_chars: 35, // Keep the bubble narrow and readable
                margin_top: 12,
                margin_bottom: 12,
                margin_start: 12,
                margin_end: 12
            });

            // 2. Create a Popover to hold the label
            const popover = new Gtk.Popover();
            popover.set_child(label);

            // 3. Create the Button (MenuButton handles popovers automatically)
            const btn = new Gtk.MenuButton({
                icon_name: 'dialog-information-symbolic',
                valign: Gtk.Align.CENTER,
                has_frame: false, // Flat style matches the row better
                popover: popover  // Attach the popover here
            });
            
            // Add a class to make it look standard
            btn.add_css_class('flat');

            row.add_suffix(btn);
        };

        // --- DNS Configuration Group ---
        const group = new Adw.PreferencesGroup({
            title: 'DNS Configuration',
            description: 'Choose which DNS to use when Secure Mode is active.',
        });
        page.add(group);

        const providers = ['Google', 'Cloudflare', 'Quad9', 'OpenDNS', 'Custom'];
        const model = new Gtk.StringList();
        providers.forEach(p => model.append(p));

        const row = new Adw.ComboRow({
            title: 'DNS Provider',
            model: model,
        });
        group.add(row);
        addInfoButton(row, "The DNS service provider used only when Bastion is in Secure Mode.");

        const current = settings.get_string('current-provider');
        const idx = providers.indexOf(current);
        if (idx !== -1) row.selected = idx;

        // --- Custom Inputs (With Validation) ---
        const customGroup = new Adw.PreferencesGroup({
            title: 'Custom DNS IPs',
            visible: (current === 'Custom')
        });
        page.add(customGroup);

        row.connect('notify::selected', () => {
            const selectedName = providers[row.selected];
            settings.set_string('current-provider', selectedName);
            customGroup.set_visible(selectedName === 'Custom');
        });

        const ip1Entry = new Adw.EntryRow({ title: 'Primary IP' });
        const ip2Entry = new Adw.EntryRow({ title: 'Secondary IP' });
        customGroup.add(ip1Entry);
        customGroup.add(ip2Entry);

        const loadCustom = () => {
            const val = settings.get_value('custom-dns').deep_unpack();
            ip1Entry.text = val[1];
            ip2Entry.text = val[2];
        };
        loadCustom();

        // VALIDATION LOGIC
        const validateAndSave = () => {
            const ipRegex = /^[0-9.]+$/;
            const t1 = ip1Entry.text.trim();
            const t2 = ip2Entry.text.trim();

            if (!ipRegex.test(t1) || !ipRegex.test(t2)) {
                return;
            }

            const val = new GLib.Variant('(sss)', ['Custom', t1, t2]);
            settings.set_value('custom-dns', val);
        };

        ip1Entry.connect('apply', validateAndSave);
        ip2Entry.connect('apply', validateAndSave);

        // --- Security Features Group ---
        const securityGroup = new Adw.PreferencesGroup({
            title: 'Security Features',
        });
        page.add(securityGroup);

        // 1. Secure Mode Encrypted DNS
        const dotSwitchSecure = new Adw.SwitchRow({
            title: 'Encrypted DNS (Secure Mode)',
            subtitle: 'Use DNS-over-TLS when Shield is Active',
        });
        securityGroup.add(dotSwitchSecure);
        settings.bind('enable-encrypted-dns', dotSwitchSecure, 'active', Gio.SettingsBindFlags.DEFAULT);

        addInfoButton(dotSwitchSecure, 
            "When ON: Forces DNS-over-TLS (DoT) for the selected provider.\n" +
            "Prevents ISPs from seeing your DNS requests."
        );

        // 2. Strict Mode Toggle
        const strictSwitch = new Adw.SwitchRow({
            title: 'Strict Mode',
            subtitle: 'Block internet if Secure DNS fails (Risky)',
        });
        securityGroup.add(strictSwitch);
        
        settings.bind('strict-dns-mode', strictSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('enable-encrypted-dns', strictSwitch, 'sensitive', Gio.SettingsBindFlags.DEFAULT);

        addInfoButton(strictSwitch, 
            "OFF (Opportunistic): Tries Secure DNS, falls back to standard if it fails.\n\n" + 
            "ON (Strict): Internet will STOP working if Secure DNS cannot connect."
        );

        // 3. Login Mode Encrypted DNS
        const dotSwitchLogin = new Adw.SwitchRow({
            title: 'Encrypted DNS (Login Mode)',
            subtitle: 'Use DNS-over-TLS when Shield is Inactive',
        });
        securityGroup.add(dotSwitchLogin);
        settings.bind('enable-encrypted-dns-login', dotSwitchLogin, 'active', Gio.SettingsBindFlags.DEFAULT);

        addInfoButton(dotSwitchLogin, 
            "Attempts to use DNS-over-TLS even when using ISP/Auto DNS.\n\n" +
            "Turn this OFF if you cannot connect to public Wi-Fi login pages."
        );

        // --- Shortcuts Group ---
        const shortcutGroup = new Adw.PreferencesGroup({
            title: 'Shortcuts',
        });
        page.add(shortcutGroup);

        const shortcutEntry = new Adw.EntryRow({
            title: 'Toggle Mode Shortcut',
            tooltip_text: 'Enter accelerator string (e.g., <Super>b)',
        });
        shortcutGroup.add(shortcutEntry);
        
        const currentShortcut = settings.get_strv('toggle-shortcut')[0];
        shortcutEntry.text = currentShortcut || '<Super>b';

        shortcutEntry.connect('apply', () => {
            if (shortcutEntry.text) {
                settings.set_strv('toggle-shortcut', [shortcutEntry.text]);
            }
        });
    }
}
