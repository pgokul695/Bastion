# 🛡️ Bastion

**A privacy-focused GNOME Shell extension to prevent DNS leaks and handle Captive Portals.**

<p align="center">
  <img src="https://raw.githubusercontent.com/gnome/gnome-shell/main/data/theme/security-high-symbolic.svg" width="120" alt="Bastion Icon">
</p>

<p align="center">
    <a href="https://extensions.gnome.org/extension/YOUR_EXTENSION_ID/">
        <img src="https://img.shields.io/badge/GNOME_Extensions-Coming_Soon-blue?logo=gnome&style=for-the-badge" alt="GNOME Extensions">
    </a>
    <a href="LICENSE">
        <img src="https://img.shields.io/badge/License-GPLv3-green?style=for-the-badge" alt="License">
    </a>
</p>

---

### 🚨 The Problem
Most DNS switchers simply change your DNS IP address (e.g., to `8.8.8.8`) but leave the **"Automatic DNS"** flag enabled in NetworkManager. This causes your system to mix your ISP's DNS with your custom DNS.

**The result:** Your ISP can still **log your DNS lookup requests** and use **DNS Poisoning** to block or redirect specific websites (like Bit.ly), even though you thought you were using Google DNS.

### 🛡️ The Bastion Solution
Bastion acts as a strict enforcer for your network settings to prevent these "DNS Leaks."

1.  **Fortress Mode (Secure):**
    * Forces `ipv4.ignore-auto-dns yes`.
    * **Prevents DNS Leaks:** Stops your computer from ever asking your ISP's server for directions.
    * **Bypasses Censorship:** Ensures domain resolution happens strictly through your chosen encrypted provider (Google, Cloudflare, etc.), bypassing ISP-level DNS blocks.

2.  **Airlock Mode (Login):**
    * Temporarily sets `ipv4.ignore-auto-dns no`.
    * Allows the ISP DNS to function solely for the purpose of loading **Captive Portals** (Login pages at Hotels, Airports, and Universities).

---

## ✨ Features

* **True Anti-Leak:** strict enforcement of NetworkManager flags.
* **Custom DNS:** Enter your own preferred Private DNS IPs via a modern Libadwaita settings window.
* **Visual Feedback:**
    * **Shield Icon:** You are Secure (ISP Blocked).
    * **Unlock Icon:** You are in Airlock/Login Mode (ISP Allowed).
* **Secure:** Uses Polkit (`pkexec`) to safely modify network settings.

---

## 📥 Installation

### Method 1: GNOME Extensions Website (Recommended)
*Coming soon to extensions.gnome.org*

### Method 2: Manual Installation (For Developers)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/bastion.git](https://github.com/yourusername/bastion.git)
    cd bastion
    ```

2.  **Install to local extensions folder:**
    ```bash
    mkdir -p ~/.local/share/gnome-shell/extensions/bastion@gokul.codes
    cp -r * ~/.local/share/gnome-shell/extensions/bastion@gokul.codes/
    ```

3.  **Compile the Settings Schema (Critical):**
    ```bash
    cd ~/.local/share/gnome-shell/extensions/bastion@gokul.codes
    glib-compile-schemas schemas/
    ```

4.  **Restart GNOME Shell:**
    * **Wayland:** Log out and log back in.
    * **X11:** Press `Alt` + `F2`, type `r`, and hit `Enter`.

5.  **Enable:**
    Open the **Extensions** app and enable "Bastion".

---

## 🚀 Usage Guide

### 1. Initial Setup (Configure your Provider)
By default, Bastion uses Google DNS. To change this:
1.  Open the **Extensions** app.
2.  Click the **Settings (⚙️)** button next to Bastion.
3.  Select your preferred provider (Cloudflare, Quad9, OpenDNS) or enter **Custom IPs**.
* *This setting determines which DNS is used when Secure Mode is active.*

### 2. Daily Use (The Toggle)
Bastion lives in your top bar as a single icon. **Click the icon** to toggle modes:

* **🛡️ Shield Icon (Secure Mode):**
    * You are safe. ISP DNS is blocked.
    * Your traffic is using the provider you chose in Settings.
* **🔓 Unlock Icon (Login Mode):**
    * You are "Open." ISP DNS is allowed.
    * Use this mode **only** when you need to log in to a captive portal.

### 3. Handling Captive Portals (Hotels / Colleges)
If you connect to Wi-Fi but the login page won't load:
1.  Look at the Bastion icon. If it is a **Shield**, click it.
2.  Wait for the icon to change to **Unlock (🔓)**.
3.  The login page should now appear. Sign in.
4.  **Important:** Once you are online, click the icon again to return to **Shield (Secure)** mode.

---

## 🔧 Technical Details

Bastion uses standard Linux networking tools to ensure reliability. It executes the following `nmcli` commands via `pkexec` (which triggers the system password prompt):

* **To Secure:**
    ```bash
    nmcli connection modify [UUID] ipv4.ignore-auto-dns yes ipv4.dns "8.8.8.8 8.8.4.4"
    ```
* **To Unlock:**
    ```bash
    nmcli connection modify [UUID] ipv4.ignore-auto-dns no ipv4.dns ""
    ```

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.
