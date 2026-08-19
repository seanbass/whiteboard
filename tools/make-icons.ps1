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
    # Date grid (generic dots, no specific number)
    $dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#90a8c0'))
    $gridTop = $s * 0.42; $gridLeft = $pad + $s * 0.06
    $cell = ($s - 2 * $pad - $s * 0.12) / 4
    $dot = [int]($cell * 0.55)
    for ($row = 0; $row -lt 3; $row++) {
        for ($col = 0; $col -lt 4; $col++) {
            $x = [int]($gridLeft + $col * $cell)
            $y = [int]($gridTop + $row * $cell)
            $g.FillRectangle($dotBrush, $x, $y, $dot, $dot)
        }
    }
    $dotBrush.Dispose()
    $bmp.Save("icons/icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}
Write-Host "Icons created."
