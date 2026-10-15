$ports = 3000, 1573

foreach ($port in $ports) {
    $found = $false

    $lines = netstat -ano | Select-String ":$port "

    foreach ($line in $lines) {
        $found = $true
        $parts = $line -split '\s+'
        $pid = $parts[-1]

        try {
            $process = Get-Process -Id $pid -ErrorAction Stop
            Write-Host "发现进程 PID: $pid，名称: $($process.ProcessName)，占用端口 $port，正在停止..." -ForegroundColor Yellow

            Stop-Process -Id $pid -Force

            Write-Host "进程 PID: $pid 已强制关闭。" -ForegroundColor Cyan
        }
        catch {
            Write-Host "无法关闭 PID: $pid，可能需要以管理员身份运行。" -ForegroundColor Red
        }
    }

    if (-not $found) {
        Write-Host "端口 $port 当前没有被占用。" -ForegroundColor Green
    }
}