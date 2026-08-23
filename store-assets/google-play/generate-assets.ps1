$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\\.."))
$outputDir = $PSScriptRoot
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$locales = @("en-US", "tr-TR", "de-DE", "es-ES", "fr-FR", "it-IT", "nl-NL", "pt-PT")

function Save-PaddedScreenshot {
  param(
    [Parameter(Mandatory = $true)][string]$SourceName,
    [Parameter(Mandatory = $true)][string]$TargetName,
    [Parameter(Mandatory = $true)][string]$SourceDirectory,
    [Parameter(Mandatory = $true)][string]$TargetDirectory
  )

  $source = [System.Drawing.Image]::FromFile((Join-Path $SourceDirectory $SourceName))
  $canvas = New-Object System.Drawing.Bitmap 1512, 2688
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::FromArgb(243, 247, 243))
  $graphics.DrawImage($source, 135, 0, 1242, 2688)
  $canvas.Save((Join-Path $TargetDirectory $TargetName), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $canvas.Dispose()
  $source.Dispose()
}

foreach ($locale in $locales) {
  $sourceDir = Join-Path $root "store-assets\\app-store\\screenshots\\ios\\$locale"
  $localeOutputDir = if ($locale -eq "en-US") { $outputDir } else { Join-Path $outputDir $locale }
  New-Item -ItemType Directory -Force -Path $localeOutputDir | Out-Null

  Save-PaddedScreenshot -SourceName "01-home.png" -TargetName "01-home-9x16.png" -SourceDirectory $sourceDir -TargetDirectory $localeOutputDir
  Save-PaddedScreenshot -SourceName "02-add-receipt.png" -TargetName "02-add-receipt-9x16.png" -SourceDirectory $sourceDir -TargetDirectory $localeOutputDir
  Save-PaddedScreenshot -SourceName "03-ai-review.png" -TargetName "03-ai-review-9x16.png" -SourceDirectory $sourceDir -TargetDirectory $localeOutputDir
  Save-PaddedScreenshot -SourceName "05-reports.png" -TargetName "04-reports-9x16.png" -SourceDirectory $sourceDir -TargetDirectory $localeOutputDir
}

$sourceDir = Join-Path $root "store-assets\\app-store\\screenshots\\ios\\en-US"

$icon = [System.Drawing.Image]::FromFile((Join-Path $root "assets\\icon.png"))
$iconOutput = New-Object System.Drawing.Bitmap 512, 512
$iconGraphics = [System.Drawing.Graphics]::FromImage($iconOutput)
$iconGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$iconGraphics.DrawImage($icon, 0, 0, 512, 512)
$iconOutput.Save((Join-Path $outputDir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$iconGraphics.Dispose()
$iconOutput.Dispose()
$icon.Dispose()

$homeScreenshot = [System.Drawing.Image]::FromFile((Join-Path $sourceDir "01-home.png"))
$feature = New-Object System.Drawing.Bitmap 1024, 500
$featureGraphics = [System.Drawing.Graphics]::FromImage($feature)
$featureGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$featureGraphics.DrawImage($homeScreenshot, (New-Object System.Drawing.Rectangle 0, 0, 1024, 500), 0, 0, 1242, 606, [System.Drawing.GraphicsUnit]::Pixel)
$feature.Save((Join-Path $outputDir "feature-graphic-1024x500.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$featureGraphics.Dispose()
$feature.Dispose()
$homeScreenshot.Dispose()

Write-Output "Google Play assets generated in $outputDir"
