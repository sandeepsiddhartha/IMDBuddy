#!/bin/bash

# IMDBuddy - Migration Script
# Migrates from old structure to new modular architecture

echo "🔄 IMDBuddy Migration Script"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Checking if old chrome-extension directory exists..."

if [ -d "chrome-extension" ]; then
    print_warning "Found old chrome-extension directory"
    
    # Check if it's identical to what we built
    if [ -d "dist/chrome-extension" ]; then
        print_status "Comparing old directory with new build..."
        
        # Compare manifest files
        if diff -q "chrome-extension/manifest.json" "dist/chrome-extension/manifest.json" > /dev/null 2>&1; then
            print_status "Manifests are identical"
        else
            print_warning "Manifests differ - this is expected with the new build system"
        fi
        
        # Since we've successfully built from shared source, we can archive the old directory
        print_status "Archiving old chrome-extension directory..."
        mv chrome-extension chrome-extension.backup
        print_success "Old directory backed up as chrome-extension.backup"
        
        print_status "Creating symlink to new build directory..."
        ln -s dist/chrome-extension chrome-extension
        print_success "Created symlink: chrome-extension -> dist/chrome-extension"
        
    else
        print_warning "New build directory not found. Run ./build-universal.sh first"
    fi
else
    print_success "No old chrome-extension directory found - migration not needed"
fi

# Do the same for safari-extension if it exists
if [ -d "safari-extension" ]; then
    print_warning "Found old safari-extension directory"
    
    if [ -d "dist/safari-extension" ]; then
        print_status "Archiving old safari-extension directory..."
        mv safari-extension safari-extension.backup
        print_success "Old directory backed up as safari-extension.backup"
        
        print_status "Creating symlink to new build directory..."
        ln -s dist/safari-extension safari-extension
        print_success "Created symlink: safari-extension -> dist/safari-extension"
    else
        print_warning "New build directory not found. Run ./build-universal.sh first"
    fi
else
    print_success "No old safari-extension directory found - migration not needed"
fi

echo ""
print_success "🎉 Migration completed!"
echo ""
echo "📦 New Structure:"
echo "   Source Code: shared/"
echo "   Built Chrome: dist/chrome-extension/ (symlinked as chrome-extension/)"
echo "   Built Safari: dist/safari-extension/ (symlinked as safari-extension/)"
echo ""
echo "🔧 Development Workflow:"
echo "   1. Edit source code in shared/"
echo "   2. Run ./build-universal.sh to rebuild"
echo "   3. Test using existing chrome-extension/ and safari-extension/ paths"
echo ""
echo "📚 For more information:"
echo "   - Architecture: ARCHITECTURE.md"
echo "   - Adding platforms: HOW-TO-ADD-STREAMING-SERVICE.md"
