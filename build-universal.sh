#!/bin/bash

# IMDBuddy - Universal Build Script
# This script builds both Chrome and Safari extensions from shared source code

set -e  # Exit on any error

echo "🚀 IMDBuddy Universal Build Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build directories
CHROME_DIR="dist/chrome-extension"
SAFARI_DIR="dist/safari-extension"
SHARED_DIR="shared"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf "$CHROME_DIR" "$SAFARI_DIR"

# Create build directories
print_status "Creating build directories..."
mkdir -p "$CHROME_DIR"
mkdir -p "$SAFARI_DIR"

# Generate manifests if they don't exist or if shared config is newer
print_status "Generating manifests from shared configuration..."
if ! ./build-tools/generate-manifests.sh; then
    print_error "Failed to generate manifests"
    exit 1
fi
print_success "Manifests generated successfully"

# Build Chrome Extension
print_status "Building Chrome extension..."

# Build content script from modular sources
print_status "Building content script from modular sources..."
if ! ./build-tools/build-content-script.sh "$CHROME_DIR/content.js"; then
    print_error "Failed to build content script"
    exit 1
fi

# Copy shared UI files
cp "$SHARED_DIR/ui/styles.css" "$CHROME_DIR/"
cp "$SHARED_DIR/ui/popup.html" "$CHROME_DIR/"

# Copy shared assets
cp -r "$SHARED_DIR/assets/images" "$CHROME_DIR/"

# Verify Chrome manifest was generated
if [ -f "$CHROME_DIR/manifest.json" ]; then
    print_success "Chrome manifest is ready"
else
    print_error "No Chrome manifest found! Generate-manifests.sh may have failed"
    exit 1
fi

print_success "Chrome extension built in $CHROME_DIR/"

# Build Safari Extension
print_status "Building Safari extension..."

# Build content script from modular sources
print_status "Building Safari content script from modular sources..."
if ! ./build-tools/build-content-script.sh "$SAFARI_DIR/content.js"; then
    print_error "Failed to build Safari content script"
    exit 1
fi

# Copy shared UI files
cp "$SHARED_DIR/ui/styles.css" "$SAFARI_DIR/"
cp "$SHARED_DIR/ui/popup.html" "$SAFARI_DIR/"

# Copy shared assets
cp -r "$SHARED_DIR/assets/images" "$SAFARI_DIR/"

# Copy Safari-specific files
cp "build-tools/safari-compatibility.js" "$SAFARI_DIR/"

# Copy Safari manifest
cp "build-tools/safari-manifest.json" "$SAFARI_DIR/manifest.json"

print_success "Safari extension built in $SAFARI_DIR/"

# Verification
print_status "Verifying builds..."

# Check Chrome extension
if [ -f "$CHROME_DIR/manifest.json" ] && [ -f "$CHROME_DIR/content.js" ] && [ -f "$CHROME_DIR/styles.css" ]; then
    print_success "Chrome extension verification passed"
else
    print_error "Chrome extension verification failed"
    exit 1
fi

# Check Safari extension  
if [ -f "$SAFARI_DIR/manifest.json" ] && [ -f "$SAFARI_DIR/content.js" ] && [ -f "$SAFARI_DIR/styles.css" ]; then
    print_success "Safari extension verification passed"
else
    print_error "Safari extension verification failed"
    exit 1
fi

echo ""
print_success "🎉 Build completed successfully!"
echo ""
echo "📦 Build Output:"
echo "   Chrome Extension: $CHROME_DIR/"
echo "   Safari Extension: $SAFARI_DIR/"
echo ""
echo "🔧 Next Steps:"
echo "   Chrome: Load unpacked extension from $CHROME_DIR/ in Chrome"
echo "   Safari: Use $SAFARI_DIR/ files in your Xcode Safari Web Extension project"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - README.md (Chrome setup)"
echo "   - Safari-App/README.md (Safari setup)"
echo "   - HOW-TO-ADD-STREAMING-SERVICE.md (Adding new platforms)"
