#!/bin/bash

# Configuration
UUID="bastion@gokul.codes"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
ZIP_NAME="bastion.zip"

# Colors for pretty output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

function install_local() {
    echo -e "${GREEN}🚀 Deploying Bastion to local system...${NC}"
    
    # 1. Create directory if it doesn't exist
    mkdir -p "$INSTALL_DIR"
    
    # 2. Copy files (using rsync to exclude dev files)
    # We exclude git, the zip file, and this script itself from the installed version
    rsync -av --delete \
        --exclude='.git' \
        --exclude='.github' \
        --exclude='*.zip' \
        --exclude='build.sh' \
        --exclude='README.md' \
        --exclude='LICENSE' \
        --exclude='CONTRIBUTING.md' \
        . "$INSTALL_DIR/"
    
    # 3. Compile Schemas (Crucial Step)
    echo -e "${GREEN}⚙️  Compiling schemas...${NC}"
    glib-compile-schemas "$INSTALL_DIR/schemas/"
    
    echo -e "${GREEN}✅ Success!${NC}"
    echo "   If you are on Wayland, you must Log Out and Log In to see changes."
    echo "   If you are on X11, press Alt+F2, type 'r', and hit Enter."
}

function package_release() {
    echo -e "${GREEN}📦 Packaging '$ZIP_NAME' for release...${NC}"
    
    # 1. Clean up old zip
    rm -f "$ZIP_NAME"
    
    # 2. Zip the files
    # STRICT EXCLUSIONS:
    # - schemas/gschema.compiled (The website rejects this!)
    # - .git folders (Security risk)
    # - build.sh (Not needed for users)
    # - Hidden system files (.DS_Store, etc)
    zip -r "$ZIP_NAME" . \
        -x "*.git*" \
        -x ".github*" \
        -x "*.DS_Store*" \
        -x "*~" \
        -x "build.sh" \
        -x "schemas/gschema.compiled" \
        -x "*.zip"
    
    echo -e "${GREEN}✅ Done!${NC}"
    echo "   Upload '$ZIP_NAME' to extensions.gnome.org"
}

# Argument Logic
if [ "$1" == "install" ]; then
    install_local
elif [ "$1" == "pack" ]; then
    package_release
else
    echo "Usage:"
    echo "  ./build.sh install  -> Copy to system & compile (For Testing)"
    echo "  ./build.sh pack     -> Create clean zip (For Website Upload)"
fi
