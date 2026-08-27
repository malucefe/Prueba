$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
docker exec caudo-postgres-1 pg_dump -U postgres caudo > "$backupDir\caudo_$timestamp.sql"
Get-ChildItem $backupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item
Write-Host "Backup created: caudo_$timestamp.sql"
