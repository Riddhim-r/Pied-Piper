$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectDirectory = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectDirectory 'build\icon.ico'
$bitmap = New-Object System.Drawing.Bitmap 256, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

$heartPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$heartPath.StartFigure()
$heartPath.AddBezier(128, 226, 108, 205, 34, 158, 34, 88)
$heartPath.AddBezier(34, 88, 34, 42, 88, 24, 128, 70)
$heartPath.AddBezier(128, 70, 168, 24, 222, 42, 222, 88)
$heartPath.AddBezier(222, 88, 222, 158, 148, 205, 128, 226)
$heartPath.CloseFigure()

$fillBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#c5425d'))
$outlinePen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#2a1f2c')), 10
$outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.FillPath($fillBrush, $heartPath)
$graphics.DrawPath($outlinePen, $heartPath)

$pngStream = New-Object System.IO.MemoryStream
$bitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $pngStream.ToArray()

$fileStream = [System.IO.File]::Create($outputPath)
$writer = New-Object System.IO.BinaryWriter $fileStream
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)

$writer.Dispose()
$pngStream.Dispose()
$outlinePen.Dispose()
$fillBrush.Dispose()
$heartPath.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Created heart icon: $outputPath"
