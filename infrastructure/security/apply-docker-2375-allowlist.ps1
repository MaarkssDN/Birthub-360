#requires -RunAsAdministrator
<#
.SYNOPSIS
  Contenção do daemon Docker remoto 192.168.0.116:2375 sem autenticação/TLS.

.DESCRIPTION
  Handoff: .agents/handoffs/00-para-10-docker-2375-sem-autenticacao.md
  Diagnóstico completo: .agents/runs/2026-11-10-ordem01-docker-2375-contencao.md

  Executar NO HOST 192.168.0.116 em PowerShell como Administrador.
  Este script implementa a Opção 1 do handoff (firewall allowlist) como
  mitigação imediata — é a ponte até a migração definitiva para ssh://
  (Opção 2, preferencial). Idempotente: pode rodar mais de uma vez.

  POR QUE SÓ REGRAS ALLOW: no Windows Firewall, Block tem precedência sobre
  Allow — uma regra Block genérica na porta 2375 bloquearia também os IPs
  autorizados. O inbound default do Windows já é "bloquear sem regra de
  allow", então basta criar Allow apenas para os IPs autorizados.

  ATENÇÃO: o firewall filtra tráfego inbound, mas se houver `netsh
  portproxy` ou port mapping do Docker publicando 0.0.0.0:2375, a regra de
  firewall continua valendo. Ao migrar para ssh://, remova também o
  portproxy para a porta não ficar escutando.

.PARAMETER AllowedIPs
  IPs autorizados a acessar a porta 2375. Default: workstation de dev.

.EXAMPLE
  .\apply-docker-2375-allowlist.ps1
  .\apply-docker-2375-allowlist.ps1 -AllowedIPs 192.168.0.179,192.168.0.50
#>
[CmdletBinding()]
param(
    [string[]]$AllowedIPs = @('192.168.0.179')
)

$ErrorActionPreference = 'Stop'
$LocalPort = 2375
$RuleAllow = 'Docker2375-Allow-DevOnly'

Write-Host "== Diagnóstico da publicação da porta $LocalPort ==" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess |
    Format-Table -AutoSize
Write-Host "portproxy atual:" -ForegroundColor Cyan
netsh interface portproxy show all

# Remove regras antigas do script para recriar com os IPs atuais (idempotente)
if (Get-NetFirewallRule -DisplayName $RuleAllow -ErrorAction SilentlyContinue) {
    # O DisplayName é o mesmo para todos os IPs; Remove-NetFirewallRule por
    # DisplayName remove todas as regras com esse nome de uma vez.
    Remove-NetFirewallRule -DisplayName $RuleAllow
    Write-Host "Regra existente '$RuleAllow' removida (será recriada)." -ForegroundColor Yellow
}

# Allow: somente estações autorizadas. Todo o resto cai no default inbound
# (block) do Windows Firewall.
foreach ($ip in $AllowedIPs) {
    New-NetFirewallRule -DisplayName $RuleAllow -Direction Inbound `
        -Protocol TCP -LocalPort $LocalPort -RemoteAddress $ip -Action Allow `
        -Profile Any | Out-Null
    Write-Host "Allow TCP $LocalPort <- $ip" -ForegroundColor Green
}

Write-Host ""
Write-Host "== Verificação ==" -ForegroundColor Cyan
Write-Host "De IP NAO autorizado: curl http://192.168.0.116:$LocalPort/version deve falhar (timeout/recusado)."
Write-Host "Do host autorizado  : docker -H tcp://192.168.0.116:$LocalPort ps deve funcionar."
Write-Host ""
Write-Host "PENDENTE (operador): migrar para ssh:// e remover exposição TCP." -ForegroundColor Yellow
Write-Host "Ver infrastructure/security/DOCKER-REMOTE-DAEMON.md"
