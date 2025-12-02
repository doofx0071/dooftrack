# PowerShell script to create PWA icons from source logo
# Uses .NET System.Drawing for image manipulation

Add-Type -AssemblyName System.Drawing

$projectRoot = "C:\Users\Damascus\Documents\code ni cris\dooftrack"
$sourceLogo = Join-Path $projectRoot "logo\Dark Mode.png"
$outputDir = Join-Path $projectRoot "public\icons"

# Create output directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Created directory: $outputDir" -ForegroundColor Green
}

function Resize-Image {
    param (
        [string]$SourcePath,
        [string]$DestinationPath,
        [int]$Width,
        [int]$Height,
        [int]$PaddingPercent = 0
    )
    
    try {
        # Load source image
        $srcImage = [System.Drawing.Image]::FromFile($SourcePath)
        
        # Calculate dimensions with padding
        if ($PaddingPercent -gt 0) {
            $paddingFactor = (100 - $PaddingPercent) / 100.0
            $innerWidth = [int]($Width * $paddingFactor)
            $innerHeight = [int]($Height * $paddingFactor)
            $offsetX = [int](($Width - $innerWidth) / 2)
            $offsetY = [int](($Height - $innerHeight) / 2)
        } else {
            $innerWidth = $Width
            $innerHeight = $Height
            $offsetX = 0
            $offsetY = 0
        }
        
        # Create destination bitmap
        $destImage = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($destImage)
        
        # Set high quality rendering
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        # Clear with transparent background
        $graphics.Clear([System.Drawing.Color]::Transparent)
        
        # Draw resized image
        $destRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $innerWidth, $innerHeight)
        $srcRect = New-Object System.Drawing.Rectangle(0, 0, $srcImage.Width, $srcImage.Height)
        $graphics.DrawImage($srcImage, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        
        # Save as PNG
        $destImage.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Cleanup
        $graphics.Dispose()
        $destImage.Dispose()
        $srcImage.Dispose()
        
        Write-Host "✓ Created: $DestinationPath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Failed to create $DestinationPath : $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n🎨 Creating PWA Icons for doofTrack..." -ForegroundColor Cyan
Write-Host "Source: $sourceLogo`n" -ForegroundColor Gray

# Check if source exists
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Source logo not found: $sourceLogo" -ForegroundColor Red
    exit 1
}

# Create standard icons (no padding)
Write-Host "Creating standard icons..." -ForegroundColor Yellow
Resize-Image -SourcePath $sourceLogo -DestinationPath (Join-Path $outputDir "icon-192.png") -Width 192 -Height 192
Resize-Image -SourcePath $sourceLogo -DestinationPath (Join-Path $outputDir "icon-512.png") -Width 512 -Height 512

# Create maskable icons (20% padding for safe zone)
Write-Host "`nCreating maskable icons (with safe zone)..." -ForegroundColor Yellow
Resize-Image -SourcePath $sourceLogo -DestinationPath (Join-Path $outputDir "icon-192-maskable.png") -Width 192 -Height 192 -PaddingPercent 20
Resize-Image -SourcePath $sourceLogo -DestinationPath (Join-Path $outputDir "icon-512-maskable.png") -Width 512 -Height 512 -PaddingPercent 20

Write-Host "`n✅ All icons created successfully!" -ForegroundColor Green
Write-Host "`nIcon files created in: $outputDir" -ForegroundColor Cyan
Write-Host "Next step: Run npm run build to test" -ForegroundColor Gray
