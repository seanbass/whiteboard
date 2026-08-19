Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path icons | Out-Null
foreach ($s in 192, 512) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#2b6cb0'))
    # White rounded "calendar" rectangle
    $pad = [int]($s * 0.15)
    $rect = New-Object System.Drawing.Rectangle($pad, [int]($s*0.2), ($s - 2*$pad), [int]($s*0.62))
    $g.FillRectangle([System.Drawing.Brushes]::White, $rect)
    # Red header band
    $band = New-Object System.Drawing.Rectangle($pad, [int]($s*0.2), ($s - 2*$pad), [int]($s*0.16))
    $g.FillRectangle([System.Drawing.Brushes]::Firebrick, $band)
    # Date text
    $font = New-Object System.Drawing.Font('Segoe UI', [int]($s*0.28), [System.Drawing.FontStyle]::Bold)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
    $textRect = New-Object System.Drawing.RectangleF($pad, ($s*0.36), ($s - 2*$pad), ($s*0.46))
    $g.DrawString('17', $font, [System.Drawing.Brushes]::Black, $textRect, $fmt)
    $bmp.Save("icons/icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}
Write-Host "Icons created."
