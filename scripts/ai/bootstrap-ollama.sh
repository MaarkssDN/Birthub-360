#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Central Birth Hub 360 — Bootstrap de Modelos no Ollama"
echo "=========================================================="

OLLAMA_CONTAINER="${1:-birthhub_ollama}"

echo "⏳ Aguardando container $OLLAMA_CONTAINER iniciar..."
until docker exec "$OLLAMA_CONTAINER" ollama list > /dev/null 2>&1; do
    echo "Aguardando Ollama daemon..."
    sleep 2
done

echo "✅ Ollama online! Baixando modelos para a Central..."

echo "📥 1/8: Baixando Llama 3.2 3B (Classificação rápida e triagem)..."
docker exec "$OLLAMA_CONTAINER" ollama pull llama3.2:3b

echo "📥 2/8: Baixando Qwen 2.5 7B (Agentes, Function Calling e Bitrix)..."
docker exec "$OLLAMA_CONTAINER" ollama pull qwen2.5:7b

echo "📥 3/8: Baixando DeepSeek R1 8B (Raciocínio lógico e análise de dados)..."
docker exec "$OLLAMA_CONTAINER" ollama pull deepseek-r1:8b

echo "📥 4/8: Baixando Llama 3.1 8B (Pitches, Quebra-gelo e Atendimento)..."
docker exec "$OLLAMA_CONTAINER" ollama pull llama3.1:8b

echo "📥 5/8: Baixando Mistral NeMo 12B (Contexto longo 128k e resumos)..."
docker exec "$OLLAMA_CONTAINER" ollama pull mistral-nemo:12b

echo "📥 6/8: Baixando BGE-M3 (Embeddings multilíngues de alta precisão)..."
docker exec "$OLLAMA_CONTAINER" ollama pull bge-m3

echo "📥 7/8: Baixando Nomic Embed Text (Embeddings rápidos e leves)..."
docker exec "$OLLAMA_CONTAINER" ollama pull nomic-embed-text

echo "📥 8/8: Baixando Qwen 2 VL 7B (Visão, OCR e leitura de notas/documentos)..."
docker exec "$OLLAMA_CONTAINER" ollama pull qwen2-vl:7b

echo "=========================================================="
echo "🎉 Todos os modelos foram configurados com sucesso no Ollama!"
echo "=========================================================="
