param([int]$Port = 5173)

$root = "C:\SoulboundMonsters"
$publicDir = Join-Path $root "public"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$Port/"

$mime = @{
    ".html"="text/html"; ".js"="application/javascript"; ".css"="text/css";
    ".json"="application/json"; ".png"="image/png"; ".jpg"="image/jpeg";
    ".jpeg"="image/jpeg"; ".gif"="image/gif"; ".svg"="image/svg+xml";
    ".ico"="image/x-icon"; ".mp3"="audio/mpeg"; ".wav"="audio/wav"; ".webp"="image/webp"
}

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    try {
        $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ($path -eq "/") { $path = "/index.html" }
        $rel = $path.TrimStart("/")

        $full = Join-Path $publicDir $rel
        if (-not (Test-Path $full -PathType Leaf)) {
            $full = Join-Path $root $rel
        }

        if (Test-Path $full -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($full).ToLower()
            $ct = $mime[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $res.ContentType = $ct
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
        }
    } catch {
        $res.StatusCode = 500
    } finally {
        $res.OutputStream.Close()
    }
}
