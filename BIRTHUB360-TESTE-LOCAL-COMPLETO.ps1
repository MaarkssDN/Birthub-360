#Requires -Version 7.0
<#
.SYNOPSIS
  Auditoria local do Birthub 360 com execucao CONTINUA e relatorio HTML.
.DESCRIPTION
  Um erro em lint, testes, integracao, E2E ou visual NAO interrompe as proximas etapas.
  Cada comando tem timeout independente. Salva stdout/stderr, findings, CSV e JSON.
  Nunca faz merge, git reset, drop database ou npm format --write.
  Protege banco: so executa testes de banco se DATABASE_URL apontar para banco *_test em host local.
.PARAMETER Projeto
  Caminho do checkout Birthub-360. Detecta caminhos usuais se omitido.
.PARAMETER Destino
  Pasta de relatorios (fora do repo por padrao).
.PARAMETER TimeoutMinutos
  Limite global por etapa em minutos (padrao 120). Os limites internos podem ser menores.
.PARAMETER SemVisuais
  Nao executa regressao visual Playwright (executada por padrao).
.PARAMETER SemCobertura
  Testes unitarios sem --coverage (reduz duracao, nao testa gate Sonar completo).
.PARAMETER SemE2E
  Pula Playwright funcional; mantem os outros testes.
.PARAMETER SemIntegracao
  Pula suite de integracao; mantem os outros testes.
.PARAMETER PermitirBancoLAN
  Permite banco *_test em IPv4 de rede privada. Nao permite IP publico ou DNS publico.
.PARAMETER NaoAbrir
  Nao abre HTML automaticamente ao final.
.EXAMPLE
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\BIRTHUB360-TESTE-LOCAL-COMPLETO.ps1 -Projeto 'C:\Users\Administrator\Documents\GitHub\Birthub-360'
#>
[CmdletBinding()]
param(
  [string]$Projeto = '',
  [string]$Destino = '',
  [ValidateRange(1, 1440)][int]$TimeoutMinutos = 120,
  [switch]$SemVisuais,
  [switch]$SemCobertura,
  [switch]$SemE2E,
  [switch]$SemIntegracao,
  [switch]$PermitirBancoLAN,
  [switch]$NaoAbrir
)

$ErrorActionPreference = 'Stop'
$inicio = Get-Date
$identificador = $inicio.ToString('yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,6)
if ([string]::IsNullOrWhiteSpace($Destino)) {
  $meusDocumentos = [Environment]::GetFolderPath('MyDocuments')
  if ([string]::IsNullOrWhiteSpace($meusDocumentos)) { $meusDocumentos = $HOME }
  $Destino = Join-Path $meusDocumentos 'Birthub360-TestReports'
}
$pastaRun = Join-Path $Destino "auditoria-$identificador"
$pastaLogs = Join-Path $pastaRun 'logs'
New-Item -ItemType Directory -Path $pastaLogs -Force | Out-Null
$caminhoHtml = Join-Path $pastaRun 'RELATORIO-BIRTHUB360.html'
$caminhoJson = Join-Path $pastaRun 'resultado.json'
$caminhoCsv = Join-Path $pastaRun 'falhas.csv'
$etapas = [System.Collections.Generic.List[object]]::new()
$achados = [System.Collections.Generic.List[object]]::new()
$chavesAchados = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$projetoValido = $false
$bancoSeguro = $false
$infraOk = $false
$portaLivre = $true
$npmExe = $null
$dockerExe = $null
$dirProjeto = ''
$gitSha = ''
$gitBranch = ''
$envCIAnterior = [Environment]::GetEnvironmentVariable('CI', 'Process')
$variaveisProtegidas = @('DATABASE_URL','DIRECT_URL','NODE_ENV','PORT','E2E_BASE_URL','BETTER_AUTH_URL','ALLOWED_ORIGINS','API_RATE_LIMIT_MAX','AUTH_RATE_LIMIT_MAX','PLAYWRIGHT_HTML_OUTPUT_DIR')
$ambienteAnterior = @{}
foreach ($v in $variaveisProtegidas) { $ambienteAnterior[$v] = [Environment]::GetEnvironmentVariable($v, 'Process') }

function H([object]$value) { return [System.Net.WebUtility]::HtmlEncode([string]$value) }
function Escrever-Evento([string]$mensagem, [string]$cor = 'Cyan') {
  Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $mensagem" -ForegroundColor $cor
}
function Limpar-Ansi([string]$s) {
  return [regex]::Replace($s, '\x1B\[[0-9;]*[A-Za-z]', '')
}
function Redigir([string]$s) {
  if ($null -eq $s) { return '' }
  $s = Limpar-Ansi $s
  $s = [regex]::Replace($s, '(?i)(postgres(?:ql)?|redis|rediss|mysql|mongodb(?:\+srv)?)://[^\s@/]+@', '$1://[CREDENCIAIS_OCULTAS]@')
  $s = [regex]::Replace($s, '(?i)(Authorization\s*[:=]\s*Bearer\s+)\S+', '$1[OCULTO]')
  $s = [regex]::Replace($s, '(?i)\b((?:GROQ|OPENAI|GEMINI|ANTHROPIC|SONAR|JWT|REDIS|MEILI|DATABASE|DIRECT|BETTER_AUTH|MINIO|AWS|GITHUB)[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)|PASSWORD)\s*[:=]\s*\S+', '$1=[OCULTO]')
  return $s
}
function Sanitizar-Arquivo([string]$arquivo) {
  if (-not (Test-Path -LiteralPath $arquivo -PathType Leaf)) { return }
  $temp = "$arquivo.safe"
  $reader = $null; $writer = $null
  try {
    $reader = [System.IO.StreamReader]::new($arquivo)
    $writer = [System.IO.StreamWriter]::new($temp, $false, [System.Text.UTF8Encoding]::new($false))
    while ($null -ne ($linha = $reader.ReadLine())) { $writer.WriteLine((Redigir $linha)) }
  } finally {
    if ($null -ne $reader) { $reader.Dispose() }
    if ($null -ne $writer) { $writer.Dispose() }
  }
  Move-Item -LiteralPath $temp -Destination $arquivo -Force
}
function Registrar-Achado([string]$etapaId,[string]$prioridade,[string]$tipo,[string]$arquivo,[string]$descricao,[string]$acao,[string]$log) {
  $descricao = Redigir $descricao
  $chave = ($etapaId+'|'+$tipo+'|'+$arquivo+'|'+$descricao).ToLowerInvariant()
  if ($script:achados.Count -ge 10000) { return }
  if (-not $script:chavesAchados.Add($chave)) { return }
  $script:achados.Add([pscustomobject]@{
    Chave=$chave; Prioridade=$prioridade; Etapa=$etapaId; Tipo=$tipo; Arquivo=$arquivo;
    Descricao=$descricao; CorrecaoSugerida=$acao; Log=$log
  })
}
function Novo-Resultado([string]$id,[string]$nome,[string]$categoria,[string]$status,[string]$comando,[int]$codigo,[double]$segundos,[string]$motivo,[string]$stdout,[string]$stderr) {
  $script:etapas.Add([pscustomobject]@{
    Id=$id; Nome=$nome; Categoria=$categoria; Status=$status; Comando=$comando;
    ExitCode=$codigo; Segundos=[math]::Round($segundos,1); Motivo=(Redigir $motivo);
    StdOut=$stdout; StdErr=$stderr
  })
}
function Ler-Cauda([string]$arquivo, [int]$quantidade=3000) {
  if (-not (Test-Path -LiteralPath $arquivo)) { return @() }
  try { return @(Get-Content -LiteralPath $arquivo -Tail $quantidade -Encoding utf8 -ErrorAction Stop) }
  catch { return @("Falha ao ler log: $($_.Exception.Message)") }
}
function Analisar-Log([string]$id,[string]$categoria,[string]$status,[string]$out,[string]$err) {
  if ($status -eq 'OK' -or $status -eq 'IGNORADO') { return }
  $ultimoArquivo = ''
  $n = 0
  # Le todos os logs sequencialmente (nao apenas as ultimas linhas), para nao perder erros anteriores.
  foreach ($logArquivo in @($out,$err)) {
   if (-not (Test-Path -LiteralPath $logArquivo -PathType Leaf)) { continue }
   foreach ($line in [System.IO.File]::ReadLines($logArquivo)) {
    $s = (Limpar-Ansi ([string]$line)).Trim()
    if (-not $s) { continue }
    $arq = ''
    $tipo = ''
    $desc = ''
    $acao = ''
    $prio = 'P1'
    if ($s -match '^(?<arq>(?:src|tests|visual-regression|scripts)[/\\][^\s]+?\.(?:ts|tsx|js|jsx|css|scss)):(?<lin>\d+):(?<col>\d+)\s+(?<erro>lint/[^\s]+|format|[^\s]*error[^\s]*)') {
      $arq = "$($Matches['arq']):$($Matches['lin'])"; $tipo = 'Lint / formatação'; $desc = $s
      $acao = 'Corrigir no arquivo indicado; validar npm run lint:ci e npm run format:check.'; $prio = 'P2'
    } elseif ($s -match '^(?<arq>(?:src|tests|visual-regression|scripts)[/\\][^\s]+?\.(?:ts|tsx|js|jsx|css|scss))\s+format\b') {
      $arq = $Matches['arq']; $tipo = 'Formatação Biome'; $desc = "Arquivo fora do padrão: $arq"
      $acao = "Revisar formatacao de $arq; aplicar Biome APENAS ao arquivo e executar npm run format:check."; $prio = 'P2'
    } elseif ($s -match '^(?<arq>[^\s]+\.(?:ts|tsx|js|jsx))\((?<lin>\d+),(?<col>\d+)\): error (?<codigo>TS\d+):\s*(?<mensagem>.*)') {
      $arq = "$($Matches['arq']):$($Matches['lin'])"; $tipo = 'TypeScript'; $desc = "$($Matches['codigo']): $($Matches['mensagem'])"
      $acao = 'Consertar tipos/imports no arquivo e repetir npm run typecheck.'
    } elseif ($s -match '^FAIL\s+(?<teste>.+?)(?:\s+>\s+|$)') {
      $arq = $Matches['teste']; $ultimoArquivo=$arq; $tipo = 'Teste reprovado'; $desc=$s
      $acao = 'Reproduzir isoladamente o teste; inspecionar a mensagem de erro, mocks, fixtures e comportamento real.'
    } elseif ($s -match '^\s*(?:\d+\)\s*)?\[(?<navegador>chromium|desktop|laptop|tablet|mobile)\].*?(?<spec>(?:tests|visual-regression)[/\\][^\s]+?\.spec\.[jt]sx?):(?<linha>\d+)') {
      $arq = "$($Matches['spec']):$($Matches['linha'])"; $tipo = 'Playwright E2E / visual'; $desc=$s
      $acao = 'Abrir o trace/screenshot no relatorio nativo do Playwright; corrigir falha funcional antes de snapshots.'
    } elseif ($s -match '(?:Error:\s*(?:P\d{4}|Database)|P10(?:01|02)|ECONNREFUSED|connection refused|getaddrinfo ENOTFOUND|timeout.*(?:5434|6379|7700))') {
      $arq=$ultimoArquivo; $tipo='Infraestrutura / banco'; $desc=$s
      $acao='Checar Docker Desktop, banco de testes, conectividade 5434/6379/7700 e migracoes; nunca usar banco de producao.'
    } elseif ($s -match '^(?:Error:|AssertionError:|TypeError:|ReferenceError:|SyntaxError:|Unhandled Rejection|Failed to parse file|Cannot find module)') {
      $arq=$ultimoArquivo; $tipo='Exceção / assertion'; $desc=$s
      $acao='Consultar trecho completo do log e stack trace; corrigir causa raiz. Nao desabilitar teste.'
    }
    if ($tipo) {
      Registrar-Achado $id $prio $tipo $arq ($desc.Substring(0,[math]::Min(500,$desc.Length))) $acao ((Split-Path $out -Leaf))
      $n++
      if ($n -ge 10000) { break }
    }
   }
   if ($n -ge 10000) { break }
  }
  if ($n -eq 0) {
    Registrar-Achado $id 'P1' 'Falha de etapa' '' "Etapa $id terminou em $status, sem mensagem categorizavel nos logs." 'Abrir stdout e stderr da etapa; procurar o primeiro erro real, dependencias e erros de ambiente.' (Split-Path $out -Leaf)
  }
}
function Invocar-Etapa {
  param([string]$Id,[string]$Nome,[string]$Categoria,[string]$Exe,[string[]]$Argumentos,[int]$Minutos,[string]$Bloqueio='')
  $nomeArquivo = $Id -replace '[^a-zA-Z0-9_-]','_'
  $out = Join-Path $script:pastaLogs "$nomeArquivo.stdout.log"
  $err = Join-Path $script:pastaLogs "$nomeArquivo.stderr.log"
  $comandoSeguro = ($Exe+' '+($Argumentos -join ' ')).Trim()
  if ($Bloqueio) {
    Novo-Resultado $Id $Nome $Categoria 'BLOQUEADO' $comandoSeguro -1 0 $Bloqueio '' ''
    Registrar-Achado $Id 'P1' 'Execução bloqueada' '' $Bloqueio 'Corrigir pre-requisito e executar novamente a auditoria; outras etapas continuam.' ''
    Escrever-Evento "BLOQUEADO $Nome - $Bloqueio" 'Yellow'
    return
  }
  Escrever-Evento "INICIANDO $Id - $Nome"
  $cron = [System.Diagnostics.Stopwatch]::StartNew()
  $processo = $null; $status='FALHA'; $codigo=-1; $mensagem=''
  try {
    # NUNCA interpolar credenciais em Argumentos ou nos comandos de teste.
    $processo = Start-Process -FilePath $Exe -ArgumentList $Argumentos -WorkingDirectory $script:dirProjeto -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError $err -ErrorAction Stop
    $limite = [math]::Max(1,[math]::Min($Minutos,$script:TimeoutMinutos)) * 60
    $proximoAviso = 60
    while (-not $processo.HasExited -and $cron.Elapsed.TotalSeconds -lt $limite) {
      Start-Sleep -Milliseconds 500
      if ($cron.Elapsed.TotalSeconds -ge $proximoAviso) {
        Escrever-Evento "EM EXECUCAO $Id | $([math]::Round($cron.Elapsed.TotalMinutes,1)) min | logs em $pastaLogs" 'DarkCyan'
        $proximoAviso += 60
      }
    }
    if (-not $processo.HasExited) {
      $status='TIMEOUT'; $codigo=124; $mensagem="Limite de $([math]::Round($limite/60,1)) minuto(s) esgotado. Arvore de processos encerrada; auditoria prosseguiu."
      try {
        if ($IsWindows) { & taskkill.exe /PID $processo.Id /T /F *> $null }
        else { $processo.Kill($true) }
      } catch { try { $processo.Kill() } catch {} }
      try { $processo.WaitForExit(3000) | Out-Null } catch {}
    } else {
      $codigo=$processo.ExitCode
      if ($codigo -eq 0) { $status='OK' } else { $status='FALHA'; $mensagem="Exit code $codigo" }
    }
  } catch {
    $status='FALHA'; $codigo=-1; $mensagem=$_.Exception.Message
    [System.IO.File]::WriteAllText($err, (Redigir $mensagem),[System.Text.UTF8Encoding]::new($false))
  } finally {
    $cron.Stop()
    if ($null -ne $processo) { $processo.Dispose() }
    foreach ($p in @($out,$err)) {
      try { Sanitizar-Arquivo $p } catch { Escrever-Evento "Aviso: nao foi possivel sanitizar o log $p: $($_.Exception.Message)" 'Yellow' }
    }
    Novo-Resultado $Id $Nome $Categoria $status $comandoSeguro $codigo $cron.Elapsed.TotalSeconds $mensagem ("logs/"+(Split-Path $out -Leaf)) ("logs/"+(Split-Path $err -Leaf))
    try { Analisar-Log $Id $Categoria $status $out $err } catch {
      Registrar-Achado $Id 'P2' 'Falha no parser de log' '' $_.Exception.Message 'Verificar manualmente stdout/stderr.' (Split-Path $out -Leaf)
    }
    $color = if ($status -eq 'OK') {'Green'} elseif ($status -eq 'TIMEOUT') {'Magenta'} else {'Red'}
    Escrever-Evento "FINALIZADO $Id => $status | $([math]::Round($cron.Elapsed.TotalMinutes,1)) min" $color
  }
}
function Valor-Env([string]$arquivo, [string]$nome) {
  if (-not (Test-Path $arquivo)) { return '' }
  foreach ($linha in [System.IO.File]::ReadLines($arquivo)) {
    if ($linha -match ('^\s*(?:export\s+)?'+[regex]::Escape($nome)+'\s*=\s*(.*)$')) {
      $v = $Matches[1].Trim()
      if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) { $v=$v.Substring(1,$v.Length-2) }
      return $v
    }
  }
  return ''
}
function Validar-Db([string]$url,[string]$rotulo) {
  if ([string]::IsNullOrWhiteSpace($url)) { return "$rotulo vazio. Configure URL de banco *_test isolado." }
  try {
    $uri = [uri]$url
    if ($uri.Scheme -notin @('postgresql','postgres')) { return "$rotulo deve usar esquema postgresql://." }
    $db = [uri]::UnescapeDataString($uri.AbsolutePath.Trim('/').Split('/')[0])
    if ($db -notmatch '(?i)(?:^|[_-])test(?:$|[_-])|_test$') { return "$rotulo aponta para banco sem sufixo _test; BLOQUEADO para proteger dados reais." }
    $dbHostName = $uri.Host.ToLowerInvariant()
    $local = $dbHostName -in @('localhost','127.0.0.1','::1','[::1]')
    $privado = $dbHostName -match '^10\.(?:\d{1,3}\.){2}\d{1,3}$' -or
      $dbHostName -match '^192\.168\.(?:\d{1,3}\.)\d{1,3}$' -or
      $dbHostName -match '^172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:\d{1,3}\.)\d{1,3}$'
    if (-not $local -and -not ($script:PermitirBancoLAN -and $privado)) { return "$rotulo aponta para host nao local; por seguranca informe -PermitirBancoLAN apenas se for DB descartavel de rede privada." }
    return ''
  } catch { return "$rotulo invalido. Informe URL PostgreSQL completa de teste (senha omitida do relatorio)." }
}
function Porta-EmUso([int]$porta) {
  foreach ($endereco in @('127.0.0.1','::1')) {
    $cliente = [System.Net.Sockets.TcpClient]::new()
    try {
      $ar = $cliente.BeginConnect($endereco,$porta,$null,$null)
      if ($ar.AsyncWaitHandle.WaitOne(350)) {
        try { $cliente.EndConnect($ar); return $true } catch { }
      }
    } catch { }
    finally { $cliente.Close() }
  }
  return $false
}
function Bloco-Pulavel([string]$id,[string]$nome,[string]$categoria,[string]$porque) {
  Novo-Resultado $id $nome $categoria 'IGNORADO' '' 0 0 $porque '' ''
  Escrever-Evento "IGNORADO $nome ($porque)" 'DarkYellow'
}

try {
  $candidatos = @()
  if ($Projeto) { $candidatos=@($Projeto) }
  else {
    $candidatos = @(
      (Join-Path $HOME 'Documents/GitHub/Birthub-360'),
      (Join-Path $HOME 'Documents/Marks/Birthub-360'),
      (Get-Location).Path
    )
  }
  foreach ($c in $candidatos) {
    if ($c -and (Test-Path (Join-Path $c 'package.json')) -and (Test-Path (Join-Path $c 'src/features/intelligence/commercial-v3/routes/commercialV3.routes.ts'))) {
      $dirProjeto = (Resolve-Path $c).Path
      $projetoValido=$true; break
    }
  }
  if (-not $projetoValido) {
    Registrar-Achado '00-preflight' 'P1' 'Projeto ausente' '' 'Nao foi encontrado package.json do checkout Birthub-360.' 'Executar com -Projeto "C:\...\Birthub-360".' ''
    Novo-Resultado '00-preflight' 'Localizar projeto' 'Ambiente' 'BLOQUEADO' '' -1 0 'Projeto nao localizado' '' ''
  } else {
    Escrever-Evento "Projeto: $dirProjeto"
    Escrever-Evento "Relatorio: $pastaRun"
    $env:CI = $null # Testes locais usam bootstrap Docker pretest (no CI bypass).
    $env:NODE_ENV = 'test'
    $env:PORT = '3000'
    $env:E2E_BASE_URL = 'http://localhost:3000'
    $env:BETTER_AUTH_URL = 'http://localhost:3000'
    $env:ALLOWED_ORIGINS = 'http://localhost:3000'
    $env:API_RATE_LIMIT_MAX = '5000'
    $env:AUTH_RATE_LIMIT_MAX = '500'
    $env:PLAYWRIGHT_HTML_OUTPUT_DIR = $null

    try { $gitSha = (& git -C $dirProjeto rev-parse --short=12 HEAD 2>$null | Select-Object -First 1).Trim() } catch {}
    try { $gitBranch = (& git -C $dirProjeto branch --show-current 2>$null | Select-Object -First 1).Trim() } catch {}
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { $npm=Get-Command npm -ErrorAction SilentlyContinue }
    if ($npm) { $npmExe=$npm.Source }
    $docker = Get-Command docker.exe -ErrorAction SilentlyContinue
    if (-not $docker) { $docker=Get-Command docker -ErrorAction SilentlyContinue }
    if ($docker) { $dockerExe=$docker.Source }
    $nodeModules = Test-Path (Join-Path $dirProjeto 'node_modules')
    $bloqNpm = if (-not $npmExe) { 'npm nao localizado; instalar Node.js 22 e abrir novo PowerShell.' }
      elseif (-not $nodeModules) { 'node_modules nao encontrado; executar npm ci antes da auditoria.' }
      else { '' }
    $envTeste = Join-Path $dirProjeto '.env.test'
    if (-not (Test-Path $envTeste)) {
      $exemplo = Join-Path $dirProjeto '.env.test.example'
      if (Test-Path $exemplo) {
        try { Copy-Item -LiteralPath $exemplo -Destination $envTeste; Escrever-Evento 'Criado .env.test a partir de .env.test.example.' 'Yellow' }
        catch { Registrar-Achado '00-preflight' 'P1' 'Ambiente' '' $_.Exception.Message 'Criar .env.test manualmente.' '' }
      }
    }
    $urlDB=Valor-Env $envTeste 'DATABASE_URL'
    $urlDireta=Valor-Env $envTeste 'DIRECT_URL'
    $erroDb=Validar-Db $urlDB 'DATABASE_URL'
    if (-not $erroDb -and $urlDireta) { $erroDb=Validar-Db $urlDireta 'DIRECT_URL' }
    if (-not $erroDb) {
      $bancoSeguro=$true
      $env:DATABASE_URL=$urlDB
      if ($urlDireta) { $env:DIRECT_URL=$urlDireta } else { $env:DIRECT_URL=$null }
      Novo-Resultado '00-banco' 'Validação de banco de teste' 'Ambiente' 'OK' '' 0 0 'Isolamento por nome _test e host permitido.' '' ''
    } else {
      $env:DATABASE_URL=$null; $env:DIRECT_URL=$null
      Novo-Resultado '00-banco' 'Validação de banco de teste' 'Ambiente' 'BLOQUEADO' '' -1 0 $erroDb '' ''
      Registrar-Achado '00-banco' 'P0' 'Proteção de dados' '' $erroDb 'Criar .env.test apontando EXCLUSIVAMENTE para prospectordb_test, nunca para banco de clientes.' ''
    }
    if (-not $bloqNpm) {
      Novo-Resultado '00-node' 'Dependências do Node.js' 'Ambiente' 'OK' '' 0 0 'npm e node_modules encontrados.' '' ''
    } else {
      Novo-Resultado '00-node' 'Dependências do Node.js' 'Ambiente' 'BLOQUEADO' '' -1 0 $bloqNpm '' ''
      Registrar-Achado '00-node' 'P1' 'Dependências' '' $bloqNpm 'Instalar dependências e repetir auditoria.' ''
    }
    $bloqDocker=''
    if (-not $dockerExe) { $bloqDocker='Docker CLI nao encontrado. Testes de integracao exigem os servicos locais.' }
    if ($dockerExe) {
      Invocar-Etapa '00-docker' 'Docker Desktop / daemon' 'Ambiente' $dockerExe @('info','--format','{{.ServerVersion}}') 2
      $infraOk = @($etapas | Where-Object { $_.Id -eq '00-docker' -and $_.Status -eq 'OK' }).Count -eq 1
      if (-not $infraOk) { $bloqDocker='Docker daemon nao respondeu; iniciar Docker Desktop e revisar log.' }
    } else {
      Novo-Resultado '00-docker' 'Docker Desktop / daemon' 'Ambiente' 'BLOQUEADO' '' -1 0 $bloqDocker '' ''
      Registrar-Achado '00-docker' 'P1' 'Docker indisponível' '' $bloqDocker 'Instalar/iniciar Docker Desktop e confirmar docker info.' ''
    }
    $portaLivre = -not (Porta-EmUso 3000)
    if ($portaLivre) { Novo-Resultado '00-porta' 'Porta exclusiva para E2E' 'Ambiente' 'OK' '' 0 0 'Porta 3000 livre; Playwright pode iniciar servidor de teste.' '' '' }
    else {
      Novo-Resultado '00-porta' 'Porta exclusiva para E2E' 'Ambiente' 'BLOQUEADO' '' -1 0 'Porta 3000 ja ocupada. Impedido reuseExistingServer para evitar testes em servidor de desenvolvimento/produção.' '' ''
      Registrar-Achado '00-porta' 'P0' 'Segurança E2E' '' 'Porta 3000 ocupada: nao rodar Playwright em servidor existente desconhecido.' 'Encerrar apenas o servidor de teste anteriormente iniciado; NAO matar processos automaticamente.' ''
    }

    $bloqGeral=$bloqNpm
    Invocar-Etapa '01-audit' 'Auditoria de dependências com waivers' 'Qualidade' $npmExe @('run','security:audit-waivers') 12 $bloqGeral
    Invocar-Etapa '02-lint' 'Biome Lint CI' 'Qualidade' $npmExe @('run','lint:ci') 20 $bloqGeral
    Invocar-Etapa '03-format' 'Biome Format Check' 'Qualidade' $npmExe @('run','format:check') 12 $bloqGeral
    Invocar-Etapa '04-types' 'TypeScript Typecheck' 'Qualidade' $npmExe @('run','typecheck') 35 $bloqGeral
    Invocar-Etapa '05-architecture' 'Fronteiras, arquitetura e hotspots' 'Qualidade' $npmExe @('run','test:architecture') 25 $bloqGeral
    Invocar-Etapa '06-openapi' 'Drift de contratos OpenAPI' 'Qualidade' $npmExe @('run','verify:openapi-drift') 15 $bloqGeral

    $bloqUnit=$bloqGeral
    if ($SemCobertura) { Invocar-Etapa '07-unit' 'Testes unitários completos' 'Testes' $npmExe @('run','test:unit') 95 $bloqUnit }
    else { Invocar-Etapa '07-unit' 'Testes unitários completos com cobertura' 'Testes' $npmExe @('run','test:unit','--','--coverage') 110 $bloqUnit }

    $bloqBanco = if ($bloqGeral) {$bloqGeral} elseif (-not $bancoSeguro) {'Banco de teste nao validado: teste com persistencia bloqueado.'} elseif (-not $infraOk) {$bloqDocker} else {''}
    if ($SemIntegracao) { Bloco-Pulavel '08-integration' 'Testes de integração (Prisma/RLS/Redis)' 'Testes' 'Omitido pelo parametro -SemIntegracao.' }
    else { Invocar-Etapa '08-integration' 'Testes de integração (Prisma/RLS/Redis)' 'Testes' $npmExe @('run','test:integration') 90 $bloqBanco }

    $bloqBrowser = if ($bloqBanco) {$bloqBanco} elseif (-not $portaLivre) {'Porta 3000 em uso; E2E bloqueado para nao reutilizar servidor desconhecido.'} else {''}
    if ($SemE2E) { Bloco-Pulavel '09-e2e' 'Playwright E2E funcional' 'Testes' 'Omitido pelo parametro -SemE2E.' }
    else {
      $portaLivre = -not (Porta-EmUso 3000)
      if (-not $portaLivre) { $bloqBrowser = 'Porta 3000 ocupada apos as etapas anteriores; E2E bloqueado para evitar reuseExistingServer.' }
      $env:PLAYWRIGHT_HTML_OUTPUT_DIR = Join-Path $pastaRun 'playwright-funcional'
      Invocar-Etapa '09-e2e' 'Playwright E2E funcional' 'Testes' $npmExe @('run','test:e2e') 120 $bloqBrowser
    }

    if ($SemVisuais) { Bloco-Pulavel '10-visual' 'Playwright regressão visual (4 viewports)' 'Testes' 'Omitido pelo parametro -SemVisuais.' }
    else {
      # Reavaliar porta, pois o processo de servidor E2E deve ter finalizado.
      $portaLivre = -not (Porta-EmUso 3000)
      $bloqVisual = if ($bloqBanco) {$bloqBanco} elseif (-not $portaLivre) {'Porta 3000 ainda em uso; visual bloqueado por seguranca.'} else {''}
      $env:PLAYWRIGHT_HTML_OUTPUT_DIR = Join-Path $pastaRun 'playwright-visual'
      Invocar-Etapa '10-visual' 'Playwright regressão visual (4 viewports)' 'Testes' $npmExe @('run','test:visual','--','--workers=2') 100 $bloqVisual
    }

    Invocar-Etapa '11-build' 'Build da aplicação e PWA' 'Build' $npmExe @('run','build') 40 $bloqGeral
    Invocar-Etapa '12-worker' 'Build do worker' 'Build' $npmExe @('run','build:worker') 25 $bloqGeral
    Invocar-Etapa '13-bundle' 'Orçamento do bundle' 'Build' $npmExe @('run','check:bundle-budget') 12 $bloqGeral
    Invocar-Etapa '14-public' 'Orçamento de ativos públicos' 'Build' $npmExe @('run','check:public-budget') 12 $bloqGeral
    Invocar-Etapa '15-drift-db' 'Drift Prisma vs banco de testes' 'Banco' $npmExe @('run','verify:migration-drift') 18 $bloqBanco
  }
} catch {
  $err = Redigir $_.Exception.ToString()
  Escrever-Evento 'ERRO DO ORQUESTRADOR. O relatorio sera gerado no finally.' 'Red'
  Registrar-Achado '00-orquestrador' 'P0' 'Erro do script' '' ($err.Substring(0,[math]::Min(700,$err.Length))) 'Corrigir script e repetir; inspecionar etapas que ja foram executadas.' ''
  Novo-Resultado '00-orquestrador' 'Exceção interna do runner' 'Ambiente' 'FALHA' '' -1 0 $err '' ''
} finally {
  # Sempre restaurar ambiente da sessao PowerShell (independente de falha).
  foreach ($key in $ambienteAnterior.Keys) { [Environment]::SetEnvironmentVariable($key, $ambienteAnterior[$key], 'Process') }
  [Environment]::SetEnvironmentVariable('CI', $envCIAnterior, 'Process')

  $fim = Get-Date
  $ok = @($etapas | Where-Object Status -eq 'OK').Count
  $falhas = @($etapas | Where-Object Status -eq 'FALHA').Count
  $timeouts = @($etapas | Where-Object Status -eq 'TIMEOUT').Count
  $bloqueados = @($etapas | Where-Object Status -eq 'BLOQUEADO').Count
  $ignorados = @($etapas | Where-Object Status -eq 'IGNORADO').Count
  $prioP0 = @($achados | Where-Object Prioridade -eq 'P0').Count
  $prioP1 = @($achados | Where-Object Prioridade -eq 'P1').Count
  $duracao = [math]::Round(($fim-$inicio).TotalMinutes,1)
  $qtd = $etapas.Count
  $cabecalho = @'
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Birthub 360 — Auditoria local completa</title>
<style>
:root{--bg:#0c1020;--panel:#151c31;--line:#2c3b5b;--txt:#d8e5fa;--muted:#9bb1cf;--cyan:#00d4ff;--pink:#ff2d9b;--gold:#ffc107;--red:#ff7588;--green:#3de4a5}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:14px/1.6 Inter,Segoe UI,sans-serif}main{max-width:1400px;margin:0 auto;padding:38px 24px 90px}h1,h2,h3{font-family:Sora,Segoe UI,sans-serif;line-height:1.25}h1{font-size:32px;color:var(--cyan);margin:6px 0 12px}h2{font-size:20px;color:var(--pink);margin:30px 0 12px}h3{color:var(--gold)}.eyebrow{color:var(--gold);font-size:11px;letter-spacing:2.5px;text-transform:uppercase}.sub{color:var(--muted);max-width:1000px}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin:28px 0}.kpi{background:var(--panel);padding:18px;border:1px solid var(--line);border-radius:12px}.kpi strong{display:block;font-size:27px;color:var(--cyan);font-variant-numeric:tabular-nums}.kpi span{color:var(--muted);font-size:12px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;margin-top:16px}table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:left;color:var(--cyan);font-size:11px;text-transform:uppercase;letter-spacing:1px;background:#1c2742}td,th{border-bottom:1px solid var(--line);padding:11px;vertical-align:top}td{overflow-wrap:anywhere}tr:hover td{background:#1c2944}a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}.badge{display:inline-block;border:1px solid;border-radius:6px;padding:1px 7px;font-weight:700;font-size:11px}.OK{color:var(--green);border-color:#216751}.FALHA,.TIMEOUT,.P0{color:var(--red);border-color:#904257}.BLOQUEADO,.P1{color:var(--gold);border-color:#9c731e}.IGNORADO,.P2{color:var(--muted);border-color:#64728b}.P3{color:var(--muted)}.muted{color:var(--muted)}code,pre{font:12px/1.5 'IBM Plex Mono',Consolas,monospace}code{overflow-wrap:anywhere}details{margin:8px 0;padding:10px;border:1px solid var(--line);border-radius:8px}summary{cursor:pointer;color:var(--cyan);font-weight:700}pre{white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto}.scroll{overflow-x:auto}.alert{border-left:3px solid var(--gold);padding:12px 16px;background:#252638}.filter{padding:9px;color:var(--txt);background:#0e1629;border:1px solid var(--line);border-radius:8px;width:100%;max-width:450px}.fine{color:var(--muted);font-size:12px;margin-top:28px}button{background:#1e3a58;color:var(--cyan);border:1px solid var(--line);border-radius:8px;padding:7px 12px;cursor:pointer}@media(max-width:760px){h1{font-size:23px}main{padding:20px 12px}table{min-width:880px}}
</style></head><body><main>
<div class="eyebrow">BIRTHUB 360° • QUALIDADE & ENGENHARIA • EXECUÇÃO LOCAL</div>
<h1>Relatório de auditoria integral</h1>
<p class="sub">Execução sem fail-fast: cada etapa tenta continuar mesmo após falhas anteriores. Falhas reais, timeouts, ausência de pré-requisitos e bloqueios de segurança são registrados separadamente. Nenhuma alteração foi enviada ao GitHub.</p>
{{META}}
{{KPIS}}
<div class="alert"><strong>Interpretação:</strong> "OK" indica que o comando encerrou com exit code 0. Não equivale a homologação completa de negócio. "BLOQUEADO" indica execução impedida por pré-requisito ou segurança. Leia os logs para traceback completo. Os achados são sugestões automáticas para triagem humana.</div>
<h2>1. Plano de correção — achados coletados</h2>
<input class="filter" id="q" placeholder="Filtrar por prioridade, arquivo, erro, etapa..." oninput="filtrar()">
<p class="muted">Os achados são extraídos dos logs por padrões; podem existir outros problemas no log que requerem leitura manual.</p>
<div class="panel scroll"><table id="issues"><thead><tr><th>Prioridade</th><th>Etapa</th><th>Tipo</th><th>Arquivo/local</th><th>Erro</th><th>Como corrigir / verificar</th></tr></thead><tbody>{{ISSUES}}</tbody></table></div>
<h2>2. Execução de todas as etapas</h2><div class="panel scroll"><table><thead><tr><th>Etapa</th><th>Categoria</th><th>Resultado</th><th>Duração</th><th>Código</th><th>Comando</th><th>Logs</th></tr></thead><tbody>{{STAGES}}</tbody></table></div>
<h2>3. Diagnóstico e evidências por etapa</h2>{{DETAILS}}
<div class="fine">Gerado por BIRTHUB360-TESTE-LOCAL-COMPLETO.ps1. Pastas locais de log e resultados JSON/CSV acompanham este arquivo. Não execute testes de integração contra dados de produção.</div>
</main><script>function filtrar(){let q=document.getElementById('q').value.toLowerCase();for(let tr of document.querySelectorAll('#issues tbody tr'))tr.style.display=tr.textContent.toLowerCase().includes(q)?'':'none'}</script></body></html>
'@
  $meta = '<p class="muted">Início: <strong>'+(H ($inicio.ToString('dd/MM/yyyy HH:mm:ss')))+'</strong> &nbsp;|&nbsp; Fim: <strong>'+(H ($fim.ToString('dd/MM/yyyy HH:mm:ss')))+'</strong> &nbsp;|&nbsp; Duração total: '+(H $duracao)+' min<br>Projeto: <code>'+(H $dirProjeto)+'</code> &nbsp;|&nbsp; Branch: <code>'+(H $gitBranch)+'</code> &nbsp;|&nbsp; HEAD: <code>'+(H $gitSha)+'</code></p>'
  $cards=@(@('Etapas',$qtd),@('Aprovadas',$ok),@('Reprovadas',$falhas),@('Timeouts',$timeouts),@('Bloqueadas',$bloqueados),@('Ignoradas',$ignorados),@('Achados',$achados.Count),@('P0 + P1',$prioP0+$prioP1))
  $kpi='<div class="kpis">';foreach($card in $cards){$kpi+='<div class="kpi"><strong>'+(H $card[1])+'</strong><span>'+(H $card[0])+'</span></div>'};$kpi+='</div>'
  $rowsIssues=[System.Text.StringBuilder]::new()
  $achadosOrdenados = @($achados | Sort-Object -Property @{Expression={ switch ($_.Prioridade) {'P0'{0} 'P1'{1} 'P2'{2} default{3}} }},'Etapa','Arquivo')
  foreach($a in $achadosOrdenados){
    $lnk= if($a.Log){'<a href="logs/'+(H $a.Log)+'">log</a>'}else{''}
    [void]$rowsIssues.AppendLine('<tr><td><span class="badge '+(H $a.Prioridade)+'">'+(H $a.Prioridade)+'</span></td><td>'+(H $a.Etapa)+'</td><td>'+(H $a.Tipo)+'</td><td><code>'+(H $a.Arquivo)+'</code></td><td>'+(H $a.Descricao)+' '+$lnk+'</td><td>'+(H $a.CorrecaoSugerida)+'</td></tr>')
  }
  if($achados.Count -eq 0){[void]$rowsIssues.Append('<tr><td colspan="6">Nenhum achado identificado. Conferir a cobertura dos testes executados.</td></tr>')}
  $rowsStages=[System.Text.StringBuilder]::new();$detalhes=[System.Text.StringBuilder]::new()
  foreach($e in $etapas){
    $links='';if($e.StdOut){$links+='<a href="'+(H $e.StdOut)+'">stdout</a> '};if($e.StdErr){$links+='<a href="'+(H $e.StdErr)+'">stderr</a>'}
    [void]$rowsStages.AppendLine('<tr><td>'+(H $e.Id)+' — '+(H $e.Nome)+'</td><td>'+(H $e.Categoria)+'</td><td><span class="badge '+(H $e.Status)+'">'+(H $e.Status)+'</span></td><td>'+(H $e.Segundos)+' s</td><td>'+(H $e.ExitCode)+'</td><td><code>'+(H $e.Comando)+'</code></td><td>'+$links+'</td></tr>')
    $fragmento='';if($e.StdOut){$file=Join-Path $pastaRun ($e.StdOut -replace '/', [IO.Path]::DirectorySeparatorChar);$fragmento+=(Ler-Cauda $file 28) -join "`n"}
    if($e.StdErr){$file=Join-Path $pastaRun ($e.StdErr -replace '/', [IO.Path]::DirectorySeparatorChar);$fragmento+="`n"+((Ler-Cauda $file 25) -join "`n")}
    if($fragmento.Length -gt 9500){$fragmento=$fragmento.Substring($fragmento.Length-9500)}
    [void]$detalhes.AppendLine('<details><summary>'+(H $e.Id)+' — '+(H $e.Nome)+' <span class="badge '+(H $e.Status)+'">'+(H $e.Status)+'</span></summary><p>'+(H $e.Motivo)+'</p><p>'+$links+'</p><pre>'+(H (Redigir $fragmento))+'</pre></details>')
  }
  $saida=$cabecalho.Replace('{{META}}',$meta).Replace('{{KPIS}}',$kpi).Replace('{{ISSUES}}',$rowsIssues.ToString()).Replace('{{STAGES}}',$rowsStages.ToString()).Replace('{{DETAILS}}',$detalhes.ToString())
  [System.IO.File]::WriteAllText($caminhoHtml,$saida,[System.Text.UTF8Encoding]::new($false))
  $dados=[ordered]@{
    projeto=$dirProjeto; commit=$gitSha; branch=$gitBranch; inicio=$inicio.ToString('o'); fim=$fim.ToString('o');
    duracaoMin=$duracao; totalEtapas=$qtd; aprovadas=$ok; reprovadas=$falhas; timeouts=$timeouts;
    bloqueadas=$bloqueados; ignoradas=$ignorados; achados=@($achados | Select-Object Prioridade,Etapa,Tipo,Arquivo,Descricao,CorrecaoSugerida,Log);
    etapas=$etapas.ToArray()
  }
  [System.IO.File]::WriteAllText($caminhoJson,($dados | ConvertTo-Json -Depth 8),[System.Text.UTF8Encoding]::new($false))
  if($achados.Count -gt 0){$achados | Select-Object Prioridade,Etapa,Tipo,Arquivo,Descricao,CorrecaoSugerida,Log | Export-Csv -Path $caminhoCsv -NoTypeInformation -Encoding utf8 }
  else {'"Prioridade","Etapa","Tipo","Arquivo","Descricao","CorrecaoSugerida","Log"' | Set-Content -Path $caminhoCsv -Encoding utf8}
  Write-Host "`n==============================================" -ForegroundColor Cyan
  Write-Host 'BIRTHUB 360 - AUDITORIA LOCAL CONCLUIDA' -ForegroundColor Cyan
  Write-Host "OK=$ok  FALHA=$falhas  TIMEOUT=$timeouts  BLOQUEADO=$bloqueados  ACHADOS=$($achados.Count)" -ForegroundColor Yellow
  Write-Host "HTML: $caminhoHtml" -ForegroundColor Green
  Write-Host "JSON: $caminhoJson"
  Write-Host "CSV : $caminhoCsv"
  Write-Host '==============================================' -ForegroundColor Cyan
  if (-not $NaoAbrir -and $IsWindows) { try { Start-Process -FilePath $caminhoHtml | Out-Null } catch {} }
}
