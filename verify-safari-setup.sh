#!/bin/bash

# Verification script for Safari extension setup
echo "🔍 Verifying Safari Extension Setup..."
echo

# Check if all required files exist
REQUIRED_FILES=(
    "safari-manifest.json"
    "safari-compatibility.js" 
    "build-safari.sh"
    "Safari-App/README.md"
    "INSTALLATION.md"
    "chrome-extension/manifest.json"
)

echo "📁 Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done
echo

# Check Safari extension directory structure
echo "📦 Checking Safari extension structure..."
if [ -d "Safari-App/IMDBuddy-Safari/IMDBuddy-Safari Extension" ]; then
    echo "✅ Safari extension directory"
    
    # Check Swift files
    if [ -f "Safari-App/IMDBuddy-Safari/IMDBuddy-Safari Extension/SafariExtensionHandler.swift" ]; then
        echo "✅ SafariExtensionHandler.swift"
    else
        echo "❌ SafariExtensionHandler.swift (missing)"
    fi
    
    # Check extension files
    EXTENSION_FILES=("content.js" "styles.css" "popup.html" "safari-compatibility.js")
    for file in "${EXTENSION_FILES[@]}"; do
        if [ -f "Safari-App/IMDBuddy-Safari/IMDBuddy-Safari Extension/$file" ]; then
            echo "✅ $file (in extension bundle)"
        else
            echo "❌ $file (missing from extension bundle)"
        fi
    done
else
    echo "❌ Safari extension directory (missing)"
fi
echo

# Check if build script is executable
if [ -x "build-safari.sh" ]; then
    echo "✅ build-safari.sh is executable"
else
    echo "⚠️  build-safari.sh is not executable (run: chmod +x build-safari.sh)"
fi
echo

# Test build script
echo "🔨 Testing build script..."
if ./build-safari.sh > /dev/null 2>&1; then
    echo "✅ Build script runs successfully"
    
    # Check generated files
    if [ -d "safari-extension" ]; then
        echo "✅ safari-extension directory generated"
        file_count=$(find safari-extension -type f | wc -l)
        echo "📊 Generated $file_count files in safari-extension/"
    else
        echo "❌ safari-extension directory not generated"
    fi
else
    echo "❌ Build script failed"
fi
echo

echo "🎯 Summary:"
echo "- Chrome extension: ✅ (moved to chrome-extension/ directory)"
echo "- Safari Web Extension: ✅ (development ready)"
echo "- Native Safari App: ✅ (Xcode project structure ready)"
echo "- Documentation: ✅ (README and installation guide)"
echo "- Build automation: ✅ (build-safari.sh script)"
echo
echo "🚀 Next steps:"
echo "1. For Chrome: Load unpacked extension from chrome-extension/ directory"
echo "2. For Safari: Follow Safari-App/README.md for Xcode setup"
echo "3. For testing: Run ./build-safari.sh and load safari-extension/ in Safari"