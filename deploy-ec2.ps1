param(
    [string]$KeyPath = $(if (Test-Path "$env:USERPROFILE\.ssh\Birthub360.pem") { "$env:USERPROFILE\.ssh\Birthub360.pem" } else { "C:\Users\marce\OneDrive\Documentos\CHAVE AWS BIRTHUB 360.pem" }),
    [string]$EC2Host = "3.143.251.44",
    [string]$EC2User = "ubuntu"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploy to AWS EC2: $EC2Host" -ForegroundColor Cyan
Write-Host "SSH Key: $KeyPath" -ForegroundColor Cyan

if (-not (Test-Path $KeyPath)) {
    Write-Host "Error: SSH key not found at $KeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "Building locally..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Copying files to EC2..." -ForegroundColor Yellow
scp -i $KeyPath -r dist "$($EC2User)@$($EC2Host):/home/ubuntu/birthhub-360/dist-new"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to copy dist" -ForegroundColor Red
    exit 1
}

$gitSha = (git rev-parse --short HEAD 2>$null)
if (-not $gitSha) { $gitSha = "unknown" }
Write-Host "SHA: $gitSha" -ForegroundColor Cyan

Write-Host "Updating application on server..." -ForegroundColor Yellow
# DEBT-0001: paridade com deploy-ec2.sh — migrate deploy antes do restart + healthcheck fail-closed.
$remoteCommands = @"
set -e
cd /home/ubuntu/birthhub-360
TS=`$(date +%Y%m%d-%H%M%S)
if [ -d dist ]; then mv dist dist-backup-`$TS; fi
mv dist-new dist
docker exec birthhub-app npx prisma migrate deploy
docker restart birthhub-app
OK=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -fsS --max-time 5 http://localhost:3000/health/ready >/dev/null 2>&1; then OK=1; break; fi
  sleep 5
done
if [ "`$OK" != "1" ]; then
  echo "DEPLOY FAILED: healthcheck nao respondeu" >&2
  docker logs --tail 50 birthhub-app >&2 || true
  exit 1
fi
echo "$gitSha `$(date -Is)" >> deploy-history.log
docker ps | grep birthhub-app
"@

ssh -i $KeyPath "$($EC2User)@$($EC2Host)" $remoteCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update server" -ForegroundColor Red
    exit 1
}

Write-Host "Deploy completed!" -ForegroundColor Green
Write-Host "Access: http://$EC2Host" -ForegroundColor Cyan
