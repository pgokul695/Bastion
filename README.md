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
Most DNS switchers simply change your DNS IP address (e.g., to `8.8.8.8`) but leave the **"Automatic DNS"** flag enabled in NetworkManager. This causes your system to mix your ISP's DNS with your custom DNS, leading to **DNS Leaks**. Your ISP can still see what websites you visit.

### 🛡️ The Bastion Solution
Bastion acts as a firewall for your DNS settings. It creates two distinct modes:

1.  **Fortress Mode (Secure):**
    * Forces `ipv4.ignore-auto-dns yes`.
    * Completely locks out your ISP's DNS.
    * Routes all queries strictly through your chosen encrypted provider (Google, Cloudflare, Quad9, or Custom).

2.  **Airlock Mode (Login):**
    * Temporarily sets `ipv4.ignore-auto-dns no`.
    * Allows the ISP DNS to function so you can load **Captive Portals** (Login pages at Hotels, Airports, and Universities).

---

## ✨ Features

* **Dropdown Menu:** Quickly switch between Google, Cloudflare, Quad9, OpenDNS, or System Default.
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

### 1. Daily Use (Secure)
Click the **Shield** icon in your top bar and select a provider (e.g., **Cloudflare**).
* *Effect:* Your connection restarts. ISP DNS is removed. You are leak-proof.

### 2. At Hotels / Colleges (Captive Portals)
If you connect to Wi-Fi but the login page won't load:
1.  Click the Bastion icon.
2.  Select **🔓 System Default (Login Mode)**.
3.  The login page will now appear. Log in.
4.  **Immediately switch back to a Secure Provider** once online.

### 3. Custom Configuration
1.  Open the menu and click **⚙️ Edit Custom DNS...**
2.  Enter your Provider Name and IPs (Primary/Secondary).
3.  Select **Custom** from the dropdown menu.

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
