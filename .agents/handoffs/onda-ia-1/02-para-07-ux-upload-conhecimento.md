- De: Agente 02
- Para: Agente 07
- Onda: IA-1
- Status: resolvido
- Prioridade: alto

## Problema

Necessário criar UX básica para upload de conhecimento (PDFs, DOCX) para ingestão no Qdrant e RAG.

## Arquivo(s) envolvido(s)

- `src/features/knowledge/components/` (propriedade do Agente 07)
- Navegação principal `src/App.tsx` (propriedade do Agente 02)

## Alteração necessária

Criar componente de upload de conhecimento com:

1. **Estado vazio** - Mensagem instrutiva quando não há documentos
2. **Loading** - Spinner durante upload/embedding
3. **Sucesso** - Feedback visual quando documento é processado
4. **Erro** - Mensagem de erro tratada com ação de retry
5. **Validação** - Restrição de tipo (PDF, DOCX) e tamanho (max 10MB)
6. **Feedback acessível** - ARIA labels, focus management, screen reader
7. **Persistência real** - Chamar endpoint backend, não apenas estado local
8. **Respeito a tenant** - Filtrar por organizationId

## Teste esperado

Teste E2E que valida:
- Upload de arquivo válido
- Bloqueio de arquivo inválido
- Estado de loading
- Persistência após reload
- Isolamento por tenant

## Contexto adicional

A ingestão backend (ingestion.service.ts) já existe. Precisa apenas da UI para expor ao usuário.

O Agente 02 pode ajudar com integração na navegação principal se necessário, mas o componente em si deve ficar em `src/features/knowledge/components/`.

## Resolução

Componente UX implementado com sucesso em src/features/knowledge/components/Base.tsx e integrado na rota /knowledge. UI validada e refinada com as guidelines Bento 2026.
