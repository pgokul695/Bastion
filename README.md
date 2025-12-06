# 🛡️ Bastion

**A privacy-focused GNOME Shell extension to prevent DNS leaks and handle Captive Portals.**

<p align="center">
    <a href="https://extensions.gnome.org/extension/8898/bastion/">
        <img src="https://img.shields.io/badge/GNOME_Extensions-blue?logo=gnome&style=for-the-badge" alt="GNOME Extensions">
    </a>
    <a href="LICENSE">
        <img src="https://img.shields.io/badge/License-GPLv3-green?style=for-the-badge" alt="License">
    </a>
</p>

---

## 🚨 The Problem

Most DNS switchers simply change your DNS IP address (e.g., to `8.8.8.8`) but leave the **"Automatic DNS"** flag enabled in NetworkManager. This causes your system to mix your ISP's DNS with your custom DNS.

**The result:** Your ISP can still **log your DNS lookup requests** and use **DNS Poisoning** to block or redirect specific websites, even though you thought you were using Google DNS.

## 🛡️ The Bastion Solution

Bastion acts as a strict enforcer for your network settings to prevent these "DNS Leaks."

1. **Fortress Mode (Secure):**
   * Forces `ipv4.ignore-auto-dns yes`.
   * **Prevents DNS Leaks:** Stops your computer from ever asking your ISP's server for directions.
   * **Encrypted DNS (DoT):** Optionally enforces **DNS-over-TLS**, ensuring your DNS queries are encrypted and cannot be read by anyone on the wire.

2. **Airlock Mode (Login):**
   * Temporarily sets `ipv4.ignore-auto-dns no`.
   * Allows the ISP DNS to function solely for the purpose of loading **Captive Portals** (Login pages at Hotels, Airports, and Universities).

---

## ✨ Features

* **True Anti-Leak:** Strict enforcement of NetworkManager flags.
* **Encrypted DNS (DoT):** Built-in support for DNS-over-TLS to prevent eavesdropping.
* **Keyboard Shortcut:** Toggle modes instantly with a customizable global hotkey (Default: `<Super>b`).
* **Smart Configuration:** Granular control to enable/disable encryption separately for Secure and Login modes.
* **User-Friendly Settings:** Modern Libadwaita preferences window with "Info" buttons explaining every feature.
* **Visual Feedback:**
  * **Shield Icon:** You are Secure (ISP Blocked).
  * **Unlock Icon:** You are in Airlock/Login Mode (ISP Allowed).
* **Secure:** Uses Polkit (`pkexec`) to safely modify network settings.

---

## 📥 Installation

### Method 1: GNOME Extensions Website (Recommended)

[*Download*](https://extensions.gnome.org/extension/8898/bastion/)

### Method 2: Manual Installation (For Developers)

1. **Clone the repository:**
```bash
   git clone https://github.com/yourusername/bastion.git
   cd bastion
```

2. **Run the Build Script:**
   We provide a helper script to install and compile schemas automatically.
```bash
   chmod +x build.sh
   ./build.sh install
```

3. **Restart GNOME Shell:**
   * **Wayland:** Log out and log back in.
   * **X11:** Press `Alt` + `F2`, type `r`, and hit `Enter`.

4. **Enable:**
   Open the **Extensions** app and enable "Bastion".

---

## 🚀 Usage Guide

### 1. Initial Setup (Settings Window)

Open the **Extensions** app and click the **Settings (⚙️)** button next to Bastion.

* **DNS Provider:** Select Google, Cloudflare, Quad9, or Custom IPs.
* **Security Features:**
  * **Encrypted DNS (Secure Mode):** Turn **ON** for maximum privacy.
  * **Encrypted DNS (Login Mode):** Keep **OFF** if you need to access hotel/airport login pages (Captive Portals often block encrypted DNS).
* **Shortcuts:** Set your custom keyboard shortcut (Default is Super+B).

### 2. Daily Use (Toggle)

You can switch modes using the **Top Bar Icon** or your **Keyboard Shortcut**.

* **🛡️ Shield Icon (Secure Mode):**
  * You are safe. ISP DNS is blocked.
  * Your traffic is using your chosen provider (and DoT if enabled).
* **🔓 Unlock Icon (Login Mode):**
  * You are "Open." ISP DNS is allowed.
  * Use this mode **only** when you need to connect to a new Wi-Fi network that requires a login.

### 3. Handling Captive Portals (Hotels / Colleges)

If you connect to Wi-Fi but the login page won't load:

1. Press `<Super>b` (or click the icon) to switch to **Unlock (🔓)**.
2. The login page should now appear. Sign in.
3. **Important:** Once you are online, press `<Super>b` again to return to **Shield (Secure)** mode.

---

## 🔧 Technical Details

Bastion uses standard Linux networking tools to ensure reliability. It executes `nmcli` commands via `pkexec` (which triggers the system password prompt).

**Example Command (Switching to Secure Mode with DoT):**
```bash
nmcli connection modify [UUID] ipv4.ignore-auto-dns yes ipv4.dns "1.1.1.1 1.0.0.1" ipv4.dns-over-tls yes
```

**Example Command (Switching to Login Mode):**
```bash
nmcli connection modify [UUID] ipv4.ignore-auto-dns no ipv4.dns "" ipv4.dns-over-tls no
```

---

## 📄 License

This project is licensed under the GNU General Public License v3.0 (GPLv3).
