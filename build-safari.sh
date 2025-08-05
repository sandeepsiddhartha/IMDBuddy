#!/bin/bash

# Safari Web Extension Build Script
# This script builds Safari extension from shared source code

echo "🦆 Building Safari Web Extension from shared source..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create Safari extension directory
SAFARI_DIR="safari-extension"
rm -rf "$SAFARI_DIR"
mkdir -p "$SAFARI_DIR"

# Copy core files from shared directory
print_status "Copying shared extension files..."
cp shared/content.js "$SAFARI_DIR/"
cp shared/ui/styles.css "$SAFARI_DIR/"
cp shared/ui/popup.html "$SAFARI_DIR/"
cp -r shared/assets/images "$SAFARI_DIR/"

# Copy Safari-specific files
if [ -f "build-tools/safari-compatibility.js" ]; then
    cp build-tools/safari-compatibility.js "$SAFARI_DIR/"
else
    echo "Warning: safari-compatibility.js not found in build-tools/"
fi

# Use Safari-compatible manifest
cp build-tools/safari-manifest.json "$SAFARI_DIR/manifest.json"

print_success "Safari Web Extension built in $SAFARI_DIR directory"
echo ""
echo "📱 To use this Safari extension:"
echo "1. Open Safari and go to Safari > Preferences > Extensions"
echo "2. Enable 'Allow Unsigned Extensions' in Developer menu"
echo "3. Load the extension from the $SAFARI_DIR directory"
echo ""
echo "📚 For detailed Safari setup instructions, see Safari-App/README.md"
echo "For distribution, you'll need to:"
echo "1. Create an Xcode project with Safari Web Extension target"
echo "2. Import these files into the extension bundle"
echo "3. Sign and distribute through Mac App Store"