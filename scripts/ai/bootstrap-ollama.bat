@echo off
echo ==========================================================
echo  Central Birth Hub 360 -- Bootstrap de Modelos no Ollama
echo ==========================================================

set OLLAMA_CONTAINER=birthhub_ollama

echo Aguardando container %OLLAMA_CONTAINER%...
docker exec %OLLAMA_CONTAINER% ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo Container %OLLAMA_CONTAINER% nao esta rodando. Verifique com docker ps.
    exit /b 1
)

echo.
echo [1/8] Baixando Llama 3.2 3B (Classificacao rapida, baixa latencia)...
docker exec %OLLAMA_CONTAINER% ollama pull llama3.2:3b

echo.
echo [2/8] Baixando Qwen 2.5 7B (Agentes, Function Calling e Bitrix)...
docker exec %OLLAMA_CONTAINER% ollama pull qwen2.5:7b

echo.
echo [3/8] Baixando DeepSeek R1 8B (Raciocinio logico e analise profunda)...
docker exec %OLLAMA_CONTAINER% ollama pull deepseek-r1:8b

echo.
echo [4/8] Baixando Llama 3.1 8B (Copywriting, pitches e atendimento)...
docker exec %OLLAMA_CONTAINER% ollama pull llama3.1:8b

echo.
echo [5/8] Baixando Mistral NeMo 12B (Contexto longo 128k e resumos)...
docker exec %OLLAMA_CONTAINER% ollama pull mistral-nemo:12b

echo.
echo [6/8] Baixando BGE-M3 (Embeddings densos e esparsos para RAG)...
docker exec %OLLAMA_CONTAINER% ollama pull bge-m3

echo.
echo [7/8] Baixando Nomic Embed Text (Embeddings rapidos e leves)...
docker exec %OLLAMA_CONTAINER% ollama pull nomic-embed-text

echo.
echo [8/8] Baixando Qwen 2 VL 7B (Visao computacional, OCR e documentos)...
docker exec %OLLAMA_CONTAINER% ollama pull qwen2-vl:7b

echo.
echo ==========================================================
echo  Todos os modelos foram configurados com sucesso no Ollama!
echo ==========================================================
