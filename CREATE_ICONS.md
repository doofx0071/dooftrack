# Creating PWA Icons for doofTrack

## Required Icon Sizes

We need 4 icon files for proper PWA support:

1. **icon-192.png** (192×192) - Standard icon
2. **icon-512.png** (512×512) - Standard icon
3. **icon-192-maskable.png** (192×192) - Maskable icon with safe zone
4. **icon-512-maskable.png** (512×512) - Maskable icon with safe zone

## Option 1: Use an Online Tool (Easiest)

### Method A: PWA Asset Generator
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload `logo/Dark Mode.png`
3. Download the generated icon pack
4. Extract and copy icons to `public/icons/` folder

### Method B: RealFaviconGenerator
1. Go to https://realfavicongenerator.net/
2. Upload `logo/Dark Mode.png`
3. Select "PWA" options
4. Generate and download
5. Copy generated icons to `public/icons/`

## Option 2: Use ImageMagick (Command Line)

If you have ImageMagick installed:

```powershell
# Navigate to project root
cd "C:\Users\Damascus\Documents\code ni cris\dooftrack"

# Create icons directory
New-Item -ItemType Directory -Force -Path public\icons

# Standard icons (no padding)
magick logo\Dark` Mode.png -resize 192x192 public\icons\icon-192.png
magick logo\Dark` Mode.png -resize 512x512 public\icons\icon-512.png

# Maskable icons (with 20% padding = safe zone)
# 192×192 with padding → actual icon is ~154×154
magick logo\Dark` Mode.png -resize 154x154 -background transparent -gravity center -extent 192x192 public\icons\icon-192-maskable.png

# 512×512 with padding → actual icon is ~410×410  
magick logo\Dark` Mode.png -resize 410x410 -background transparent -gravity center -extent 512x512 public\icons\icon-512-maskable.png
```

## Option 3: Use an Online Resizer

### Method: Simple Image Resizer
1. Go to https://www.simpleimageresizer.com/
2. Upload `logo/Dark Mode.png`
3. Resize to:
   - 192×192 → Save as `icon-192.png`
   - 512×512 → Save as `icon-512.png`
4. For maskable icons:
   - Use https://maskable.app/editor
   - Upload your 192×192 and 512×512 icons
   - Add 20% padding (safe zone)
   - Download as `icon-192-maskable.png` and `icon-512-maskable.png`
5. Move all 4 files to `public/icons/` folder

## Option 4: Manual with Image Editor (Photoshop/GIMP/Photopea)

### For Standard Icons:
1. Open `logo/Dark Mode.png` in your editor
2. Resize to 192×192 (no padding) → Save as `public/icons/icon-192.png`
3. Resize to 512×512 (no padding) → Save as `public/icons/icon-512.png`

### For Maskable Icons:
1. Create new 192×192 transparent canvas
2. Place your logo centered, but scale it to ~154×154 (80% of canvas)
3. This leaves 20% safe zone around edges
4. Save as `public/icons/icon-192-maskable.png`
5. Repeat for 512×512 (logo scaled to ~410×410)
6. Save as `public/icons/icon-512-maskable.png`

## Maskable Icon Safe Zone Explained

Maskable icons need padding because different devices/browsers may crop the icon into different shapes:
- Circle crop (Android)
- Rounded square (iOS)
- Squircle (some Android launchers)

The safe zone ensures your logo isn't cut off regardless of the mask shape.

**Visual Guide:**
```
┌─────────────────────┐
│   🔴 Unsafe Zone    │  ← May be cropped
│  ┌───────────────┐  │
│  │               │  │
│  │  ✅ Safe Zone │  │  ← Logo goes here (80% of canvas)
│  │               │  │
│  └───────────────┘  │
│   🔴 Unsafe Zone    │
└─────────────────────┘
```

## After Creating Icons

Once you have all 4 icon files in `public/icons/`, the manifest.json will be automatically updated by the script.

## Verify Icons

After deployment, test at:
- https://maskable.app/ (upload your maskable icons to preview how they look in different shapes)
- Chrome DevTools → Application → Manifest (check for warnings)
