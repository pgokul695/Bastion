# Contributing to Bastion

Thank you for your interest in contributing to Bastion! We welcome pull requests, bug reports, and feature suggestions.

## 🛠️ Development Setup

Developing GNOME extensions requires a specific setup to link your source code to the system's extension directory.

### 1. Prerequisites

You will need `git`, `zip`, and `glib2-tools` (for compiling schemas).

**Fedora:**
```bash
sudo dnf install git zip glib2-devel
```

**Ubuntu/Debian:**
```bash
sudo apt install git zip libglib2.0-bin
```

### 2. Clone the Repository

Clone the project to your preferred development folder (e.g., `~/Projects`).

```bash
git clone https://github.com/yourusername/bastion.git
cd bastion
```

### 3. Install for Testing

We use a build script to handle installation. To install the extension to your local machine for testing:

```bash
chmod +x build.sh
./build.sh install
```

This will:
1. Copy the files to `~/.local/share/gnome-shell/extensions/bastion@gokul.codes`.
2. Compile the GSettings schemas automatically.

### 4. Load the Extension

After installing, you must reload GNOME Shell:
* **Wayland:** Log Out and Log Back In.
* **X11:** Press `Alt`+`F2`, type `r`, and press `Enter`.

Enable the extension using the Extensions app.

## 🐛 Debugging

If the extension crashes or behaves unexpectedly, you can view the live logs using `journalctl`.

Watch logs in real-time:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i "bastion"
```

## 📦 Packaging for Release

If you are a maintainer preparing a release for extensions.gnome.org:

```bash
./build.sh pack
```

This generates a clean `bastion.zip` file (excluding git files and compiled schemas) ready for upload.

## 📝 Coding Guidelines

* **Modern JS:** Use `const`/`let` instead of `var`.
* **Imports:** Use ESM imports (e.g., `import Gio from 'gi://Gio';`).
* **UI:** Use `Libadwaita` widgets for preferences where possible.
* **Security:** NEVER modify `pkexec` commands to be unsafe. All network changes must be explicit.
