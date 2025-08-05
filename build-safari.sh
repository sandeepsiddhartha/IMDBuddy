#!/bin/bash

# Safari Web Extension Build Script
# This script converts the Chrome extension to Safari Web Extension format

echo "Building Safari Web Extension from Chrome Extension..."

# Create Safari extension directory
SAFARI_DIR="safari-extension"
rm -rf "$SAFARI_DIR"
mkdir -p "$SAFARI_DIR"

# Copy core files
echo "Copying extension files..."
cp safari-compatibility.js "$SAFARI_DIR/"
cp chrome-extension/content.js "$SAFARI_DIR/"
cp chrome-extension/styles.css "$SAFARI_DIR/"
cp chrome-extension/popup.html "$SAFARI_DIR/"
cp -r chrome-extension/images "$SAFARI_DIR/"

# Use Safari-compatible manifest
cp safari-manifest.json "$SAFARI_DIR/manifest.json"

echo "Safari Web Extension built in $SAFARI_DIR directory"
echo ""
echo "To use this Safari extension:"
echo "1. Open Safari and go to Safari > Preferences > Extensions"
echo "2. Enable 'Allow Unsigned Extensions' in Developer menu"
echo "3. Load the extension from the $SAFARI_DIR directory"
echo ""
echo "For distribution, you'll need to:"
echo "1. Create an Xcode project with Safari Web Extension target"
echo "2. Import these files into the extension bundle"
echo "3. Sign and distribute through Mac App Store"