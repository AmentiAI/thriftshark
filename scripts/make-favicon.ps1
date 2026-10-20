Add-Type -AssemblyName System.Drawing

function Resize-Png {
  param(
    [string]$Src,
    [string]$Dest,
    [int]$Size
  )

  $img = [System.Drawing.Image]::FromFile((Resolve-Path $Src))
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Black)

  $scale = [Math]::Min($Size / $img.Width, $Size / $img.Height)
  $w = [int]($img.Width * $scale)
  $h = [int]($img.Height * $scale)
  $x = [int](($Size - $w) / 2)
  $y = [int](($Size - $h) / 2)
  $g.DrawImage($img, $x, $y, $w, $h)

  $out = Join-Path (Get-Location) $Dest
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  $img.Dispose()
}

Resize-Png -Src "public\crest.png" -Dest "app\icon.png" -Size 64
Resize-Png -Src "public\crest.png" -Dest "app\apple-icon.png" -Size 180
Get-Item app\icon.png, app\apple-icon.png | Format-Table Name, Length
