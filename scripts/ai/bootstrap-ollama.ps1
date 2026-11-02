<#
.SYNOPSIS
    Central Birth Hub 360 - Bootstrap de Modelos Locais no Docker Ollama
.DESCRIPTION
    Baixa os modelos essenciais de IA selecionados para a plataforma Birth Hub 360.
#>

param(
    [string]$Container = "birthhub_ollama",
    [switch]$EmbeddingsOnly,
    [switch]$FastOnly
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Central Birth Hub 360 -- Bootstrap de Modelos no Ollama" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$running = docker ps --filter "name=$Container" --format "{{.Names}}"
if (-not $running) {
    Write-Host "[ERRO] Container '$Container' nao esta em execucao. Execute 'docker compose up -d ollama' primeiro." -ForegroundColor Red
    exit 1
}

function Pull-Model([string]$modelName, [string]$description) {
    Write-Host "`n--> Baixando: $modelName ($description)..." -ForegroundColor Yellow
    docker exec $Container ollama pull $modelName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] $modelName pronto!" -ForegroundColor Green
    } else {
        Write-Host "    [FALHA] Nao foi possivel baixar $modelName" -ForegroundColor Red
    }
}

if ($EmbeddingsOnly) {
    Pull-Model "bge-m3" "Embeddings multilingues de alta precisao"
    Pull-Model "nomic-embed-text" "Embeddings rapidos e leves"
} elseif ($FastOnly) {
    Pull-Model "llama3.2:3b" "Classificacao rapida e baixa latencia"
    Pull-Model "nomic-embed-text" "Embeddings rapidos"
} else {
    Pull-Model "llama3.2:3b" "Classificacao rapida e triagem de leads"
    Pull-Model "qwen2.5:7b" "Agentes, Function Calling e integracao Bitrix"
    Pull-Model "deepseek-r1:8b" "Raciocinio logico e analise profunda"
    Pull-Model "llama3.1:8b" "Copywriting, pitches comerciais e atendimento"
    Pull-Model "mistral-nemo:12b" "Contexto longo 128k e resumos de conversas"
    Pull-Model "bge-m3" "Embeddings multilingues densos/esparsos para RAG"
    Pull-Model "nomic-embed-text" "Embeddings rapidos e leves"
    Pull-Model "qwen2-vl:7b" "Visao computacional, OCR e documentos"
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Processo finalizado! Lista de modelos disponíveis:" -ForegroundColor Cyan
docker exec $Container ollama list
Write-Host "==========================================================" -ForegroundColor Cyan
