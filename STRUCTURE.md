# Extension Structure Reorganization

This document explains the changes made to reorganize the Chrome extension structure and implement shared manifest configuration.

## Changes Made

### 1. Chrome Extension Organization
- **Moved Chrome extension to dedicated directory**: `chrome-extension/`
- **Cleaned up root directory**: Removed Chrome-specific files from repository root
- **Updated build scripts**: Modified `build-safari.sh` to source files from `chrome-extension/`
- **Updated verification scripts**: Modified `verify-safari-setup.sh` to check new structure

### 2. Shared Manifest Configuration
- **Created shared configuration**: `shared-config.json` contains common extension settings
- **Implemented manifest generation**: `generate-manifests.sh` creates both Chrome and Safari manifests
- **Maintained browser-specific differences**: Handles Manifest V2 vs V3 differences automatically

## Directory Structure

```
IMDBuddy/
├── chrome-extension/           # Chrome extension (NEW)
│   ├── manifest.json          # Chrome Manifest V3 (MOVED)
│   ├── content.js             # Main content script (MOVED)
│   ├── popup.html             # Extension popup (MOVED)
│   ├── styles.css             # Extension styles (MOVED)
│   └── images/                # Extension icons (MOVED)
├── Safari-App/                # Safari extension Xcode project
├── safari-manifest.json       # Safari Manifest V2 (EXISTING)
├── safari-compatibility.js    # Safari compatibility layer (EXISTING)
├── shared-config.json         # Shared configuration (NEW)
├── generate-manifests.sh      # Generate manifests (NEW)
├── build-safari.sh           # Build Safari extension (UPDATED)
└── verify-safari-setup.sh    # Verify setup (UPDATED)
```

## Manifest Sharing Solution

### Why Not a Single Manifest?
The Chrome and Safari extensions require fundamentally different manifest structures:

| Aspect | Chrome (V3) | Safari (V2) |
|--------|-------------|-------------|
| Version | `manifest_version: 3` | `manifest_version: 2` |
| Permissions | Separate `permissions` and `host_permissions` | Combined `permissions` array |
| Action | `action` | `browser_action` |
| Scripts | Standard content scripts | Includes `safari-compatibility.js` |
| Settings | No browser-specific settings | `browser_specific_settings` |

### Shared Configuration Approach
Instead of maintaining two separate manifests manually, we now use:

1. **`shared-config.json`**: Contains common configuration (name, version, permissions, etc.)
2. **`generate-manifests.sh`**: Automatically generates both manifests with proper formatting
3. **Browser-specific transformations**: Handles V2/V3 differences automatically

### Benefits
- ✅ **Single source of truth** for common settings
- ✅ **Automatic consistency** between Chrome and Safari versions
- ✅ **Proper handling** of manifest version differences
- ✅ **Easy maintenance** - update shared config once
- ✅ **Clear documentation** of differences between browsers

## Workflow

### For Development
1. **Edit shared configuration**: Modify `shared-config.json` for common changes
2. **Generate manifests**: Run `./generate-manifests.sh` to update both manifests
3. **Test Chrome**: Load unpacked extension from `chrome-extension/`
4. **Test Safari**: Run `./build-safari.sh` and test generated extension

### For Adding New Permissions
1. Update `shared-config.json` host_permissions array
2. Run `./generate-manifests.sh` to update both manifests
3. Both Chrome and Safari will have consistent permissions

## Verification
All existing functionality is preserved:
- ✅ Chrome extension works from new `chrome-extension/` directory
- ✅ Safari build process works with updated structure
- ✅ Both manifests are correctly generated from shared config
- ✅ Verification script confirms all components work
- ✅ Documentation updated to reflect new structure

## Migration Notes
- **Developers**: Update bookmark to load Chrome extension from `chrome-extension/` directory
- **CI/CD**: Update any automation to reference new directory structure
- **Documentation**: All guides updated to reflect new organization