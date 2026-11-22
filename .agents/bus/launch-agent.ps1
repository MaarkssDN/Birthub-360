<#
.SYNOPSIS
  Lança uma sessão independente para qualquer Agente do BIRTH HUB 360 em uma nova janela.
.EXAMPLE
  .\.agents\bus\launch-agent.ps1 -AgentId "01"
  .\.agents\bus\launch-agent.ps1 -AgentId "00"
  .\.agents\bus\launch-agent.ps1 -AgentId "06" -CreateWorktree
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$AgentId,

  [switch]$CreateWorktree
)

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location $RepoRoot

$RosterPath = Join-Path $RepoRoot ".agents\bus\roster.json"
if (-not (Test-Path $RosterPath)) {
  Write-Error "Arquivo roster.json não encontrado em $RosterPath"
  exit 1
}

$Roster = Get-Content $RosterPath -Raw | ConvertFrom-Json
$Agent = $Roster | Where-Object { $_.id -eq $AgentId }

if (-not $Agent) {
  Write-Host "Agente '$AgentId' não encontrado no roster oficial." -ForegroundColor Red
  Write-Host "Agentes disponíveis: $($Roster.id -join ', ')" -ForegroundColor Yellow
  exit 1
}

Write-Host "Preparando sessão para o Agente $($Agent.id) — $($Agent.name)..." -ForegroundColor Cyan

# Garante que o barramento está ativo
$BusCheck = try { (Invoke-WebRequest -Uri "http://localhost:4100/api/status" -UseBasicParsing -TimeoutSec 1).StatusCode } catch { 0 }
if ($BusCheck -ne 200) {
  Write-Host "Iniciando Agent Bus na porta 4100..." -ForegroundColor Gray
  node (Join-Path $RepoRoot ".agents\bus\agent-cli.mjs") start
  Start-Sleep -Seconds 1
}

$WorktreeDir = $RepoRoot
if ($CreateWorktree -and $AgentId -ne "00") {
  $BranchName = "agente/$($Agent.id)-$($Agent.slug)"
  $WorktreeDir = Join-Path (Split-Path -Parent $RepoRoot) "birthub-agente-$($Agent.id)"
  if (-not (Test-Path $WorktreeDir)) {
    Write-Host "Criando Git Worktree em $WorktreeDir na branch $BranchName..." -ForegroundColor Green
    git worktree add $WorktreeDir -b $BranchName integracao/onda-1
  }
}

$PromptFile = Join-Path $RepoRoot $Agent.prompt
$PromptPreview = if (Test-Path $PromptFile) { Get-Content $PromptFile -TotalCount 20 | Out-String } else { "Prompt em $PromptFile" }

# Comando para a nova janela
$CmdScript = @"
Set-Location '$WorktreeDir'
`$host.UI.RawUI.WindowTitle = 'BIRTH HUB 360 - Agente $($Agent.id): $($Agent.name)'
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host '  VOCÊ É O AGENTE $($Agent.id) — $($Agent.name)' -ForegroundColor Yellow
Write-Host '  Função: $($Agent.role)' -ForegroundColor White
Write-Host '  Prompt Oficial: $($Agent.prompt)' -ForegroundColor Gray
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host ''
node '$RepoRoot\.agents\bus\agent-cli.mjs' session --id '$($Agent.id)'
"@

# Abre em nova janela do PowerShell
Start-Process powershell -ArgumentList "-NoExit", "-Command", $CmdScript
Write-Host "Janela do Agente $($Agent.id) aberta com sucesso!" -ForegroundColor Green
