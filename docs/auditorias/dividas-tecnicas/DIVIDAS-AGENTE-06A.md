# Relatório de Auditoria de Dívidas Técnicas — Agente 06A

## IDENTIFICAÇÃO
- **ID do agente:** 06A
- **Nome oficial:** Especialista de Extrações Bitrix
- **Especialização:** Extração massiva de dados do Bitrix24 (Leads, Negócios, Contatos, Empresas, Atividades, Usuários), paginação de alto volume por cursor/batch, suporte a campos dinâmicos `UF_CRM_*`, geração eficiente de arquivos CSV/XLSX/JSON e proteção contra esgotamento de memória
- **Responsabilidades:** Sub-especialista do Agente 06 focado no pipeline de extração de grandes volumes de CRM, streaming de dados para exportação, prevenção de CSV Injection, gestão de quotas de requisição Bitrix e isolamento estrito de arquivos exportados por organização.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `src/features/integrations/bitrix/service/extraction.ts`, rotas de exportação do Bitrix, geradores de planilhas Excel/CSV e histórico de extrações.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Motor de extração em lote, processador de paginação Bitrix por cursor (`start=...`), gerador de exportação Excel/CSV, sanitizador de campos personalizados `UF_CRM_*`.
- **Arquivos relevantes:**
  - `src/features/integrations/bitrix/service/extraction.ts` (1014 linhas, sob exceção em `HOTSPOT_EXCEPTIONS.md`)
  - `src/features/integrations/bitrix/routes/extraction.routes.ts`
  - `src/features/integrations/bitrix/service/exportFormatter.service.ts`
  - `docs/auditoria-divida-tecnica/DEP-008-plano-migracao-exceljs.md`
- **Serviços existentes:** `BitrixExtractionService`, `ExportFormatterService`, `BitrixCursorPaginator`.
- **APIs e integrações:** Bitrix24 Batch API (`crm.lead.list`, `crm.deal.list`, `crm.contact.list`, `crm.company.list`, `crm.activity.list`, `user.get`).
- **Funcionalidades implementadas:** Extração de campos padrão e dinâmicos, estimativa de progresso percentual, histórico de extrações salvas no PostgreSQL, download de arquivos zipados por tenant.
- **Testes encontrados:** `tests/unit/bitrix-extraction.service.test.ts`, `tests/integration/bitrix-export.test.ts`.
- **Dependências externas:** `exceljs`, `archiver`, `@prisma/client`.

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-06A-001
- **Título:** Acúmulo de dados em arrays de memória durante paginação massiva em extraction.ts com risco de Out of Memory
- **Categoria:** Performance e Arquitetura
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/integrations/bitrix/service/extraction.ts` (linhas 180-245)
- **Evidência:** O método `extractEntityData` pagina centenas de lotes de 50 registros via cursor e empilha todos os objetos retornados em um array JavaScript local (`const allRecords = []`). Quando o portal do cliente possui mais de 80.000 leads, o tamanho do array atinge centenas de megabytes.
- **Problema:** Em extrações completas de portais corporativos do Bitrix24, o processo do Node.js atinge o limite máximo de heap memory (`--max-old-space-size`), provocando crash imediato por Out of Memory (OOM) e reinicialização do container.
- **Causa raiz:** Implementação desenhada originalmente para pequenos volumes sem pipeline de streaming orientado a chunks ou persistência intermediária em disco.
- **Impacto:** Impossibilidade de extrair bases grandes de clientes empresariais; instabilidade do servidor de backend durante horários de trabalho.
- **Correção necessária:** Refatorar o processador de extração para utilizar Node.js Streams (`stream.Transform`) escrevendo diretamente em arquivos temporários em disco ou gravando no storage S3 em lotes parciais, sem manter o conjunto completo de dados em memória RAM.
- **Agente proprietário:** 06A
- **Agentes dependentes:** 16 (Workers e Escala), 10 (SRE e Recursos de Container)
- **Complexidade:** Grande (3 a 4 dias)
- **Prioridade:** P1
- **Critério de aceite:** Extração de base simulada com 150.000 leads consome no máximo 150MB de memória RAM do processo Node.js durante toda a execução.
- **Teste necessário:** Teste de estresse com mock de paginação de 100.000 entidades monitorando o consumo de heap memory via `process.memoryUsage()`.
- **Dependências:** Alinhamento de infraestrutura com Agente 16.

### ID: DIV-06A-002
- **Título:** Ausência de sanitização contra CSV/Formula Injection em campos dinâmicos de texto livre do Bitrix
- **Categoria:** Segurança da Informação
- **Severidade:** Alta
- **Status:** Confirmada
- **Localização:** `src/features/integrations/bitrix/service/exportFormatter.service.ts` (linhas 75-102)
- **Evidência:** Os campos de texto personalizados do Bitrix (`UF_CRM_*`), como observações, títulos ou cargos, são concatenados diretamente nas células de planilhas CSV e XLSX sem escape de caracteres de controle de fórmulas.
- **Problema:** Se um lead for cadastrado no Bitrix com um nome malicioso contendo prefixos como `=cmd|' /C calc'!A0` ou `@SUM(...)`, o Excel ou LibreOffice executará a fórmula automaticamente ao abrir o arquivo exportado na máquina do operador, abrindo vetor para Remote Code Execution (RCE) no endpoint da vítima.
- **Causa raiz:** O formatador de exportação trata campos de texto como strings confiáveis sem sanitização de caracteres especiais de planilha (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Impacto:** Vulnerabilidade de segurança para gestores e operadores que fazem download de relatórios do Bitrix em suas estações locais.
- **Correção necessária:** Implementar sanitização preventiva prefixando com apóstrofo (`'`) qualquer valor textual que inicie com os caracteres `=, +, -, @, \t, \r` antes de gravar no arquivo CSV/XLSX.
- **Agente proprietário:** 06A
- **Agentes dependentes:** 15 (Segurança Aplicada), 24 (Auditoria de Segurança)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P1
- **Critério de aceite:** Qualquer string contendo `=1+1` ou `@malicious` é gravada no CSV com apóstrofo de proteção (`'=1+1`), renderizando como texto puro no Microsoft Excel.
- **Teste necessário:** Teste unitário com fixture contendo payloads clássicos de CSV Injection verificando a saída gerada.
- **Dependências:** Nenhuma.

### ID: DIV-06A-003
- **Título:** Falta de rotina de purga periódica de arquivos temporários gerados em extrações antigas
- **Categoria:** Confiabilidade e Infraestrutura
- **Severidade:** Média
- **Status:** Confirmada
- **Localização:** `src/features/integrations/bitrix/service/extraction.ts` (linhas 310-330)
- **Evidência:** Arquivos gerados (.xlsx e .zip) são salvos no diretório local de uploads/exportações temporárias e o caminho é gravado na tabela `ExtractionHistory`. Não existe job agendado para deletar os arquivos físicos após o prazo de retenção (ex.: 7 dias).
- **Problema:** Com dezenas de extrações executadas mensalmente por clientes, o volume de disco do container ou do servidor local atinge 100% de capacidade, travando a criação de novas sessões e logs.
- **Causa raiz:** O desenvolvimento focou no fluxo de download imediato sem implementação de governança de ciclo de vida do arquivo temporário.
- **Impacto:** Risco de parada do serviço por falta de espaço em disco no filesystem do servidor.
- **Correção necessária:** Implementar rotina de expurgo que remove arquivos físicos em disco com mais de 7 dias ou realizar o upload direto para bucket S3 com política de Lifecycle Rules (TTL de 7 dias com auto-delete).
- **Agente proprietário:** 06A
- **Agentes dependentes:** 10 (SRE e Armazenamento), 21 (LGPD e Retenção)
- **Complexidade:** Pequena (1 dia)
- **Prioridade:** P2
- **Critério de aceite:** Rotina diária de limpeza remove com sucesso arquivos com data de criação superior a 7 dias, atualizando o status do histórico para `EXPIRED`.
- **Teste necessário:** Teste automatizado de expurgo com arquivos com timestamp artificialmente modificado no passado.
- **Dependências:** Alinhamento com Agente 10.

### ID: DIV-06A-004
- **Título:** Ausência de cancelamento cooperativo via AbortSignal em extrações Bitrix em lote
- **Categoria:** Resiliência e Recursos
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `src/features/integrations/bitrix/service/extraction.ts` (linhas 140-175)
- **Evidência:** Quando o usuário clica no botão "Cancelar Extração", o registro no banco é alterado para `status = 'CANCELLED'`, mas o loop de requisições assíncronas do Node.js continua requisitando páginas adicionais na API do Bitrix até o esgotamento do cursor.
- **Problema:** Desperdício de quotas de API do Bitrix24 e processamento inútil de CPU no backend após o cancelamento pelo usuário.
- **Causa raiz:** O loop de paginação não verifica o status da extração entre uma página e outra e não propaga um `AbortController.signal` para os métodos de busca.
- **Impacto:** Consumo de recursos de rede e CPU desnecessário após o usuário solicitar a interrupção da tarefa.
- **Correção necessária:** Integrar `AbortSignal` no loop de paginação, abortando imediatamente requisições HTTP subsequentes se o job for cancelado.
- **Agente proprietário:** 06A
- **Agentes dependentes:** 06 (Integrações Bitrix)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** Chamada de cancelamento interrompe a execução das requisições Bitrix em menos de 1 segundo.
- **Teste necessário:** Teste com mock de paginação verificando que o número de requisições emitidas cessa após o disparo do sinal de abort.
- **Dependências:** Nenhuma.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (extração de todas as entidades principais e suporte a campos customizados `UF_CRM_*`).
- **Cobertura automatizada de testes:** Média (fluxo feliz coberto, mas faltam testes de segurança contra CSV injection e estresse de memória).
- **Segurança:** Média (comprometida pela ausência de sanitização contra CSV Injection).
- **Arquitetura:** Média (hotspot em `extraction.ts` necessita migração para streaming).
- **Confiabilidade:** Média (vulnerável a Out of Memory em portais muito grandes).
- **Observabilidade:** Alta (progresso de extração e contagem de itens gravados em PostgreSQL).
- **Manutenibilidade:** Média (código de formatação e paginação altamente concentrado).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Implementar sanitização obrigatória contra CSV/Formula Injection em todos os campos de texto exportados (DIV-06A-002).
2. **Segurança e integridade de dados:** Garantir isolamento estrito de arquivos exportados por pasta de tenant.
3. **Falhas funcionais:** Refatorar extração massiva para Node.js Streams eliminando risco de Out of Memory (DIV-06A-001).
4. **Confiabilidade:** Criar job de expurgo de arquivos temporários com mais de 7 dias (DIV-06A-003).
5. **Testes:** Criar testes de regressão de sanitização de fórmulas maliciosas.
6. **Arquitetura:** Adicionar cancelamento cooperativo via AbortSignal nas requisições em lote (DIV-06A-004).
7. **Melhorias estruturais:** Implementar exportação direta para storage S3 com links pré-assinados.

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 4
- **Quantidade por severidade:** 0 Críticas, 2 Altas, 1 Média, 1 Baixa
- **Quantidade confirmada:** 4
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 3 (DIV-06A-001, DIV-06A-002, DIV-06A-004)
- **Problemas compartilhados:** 1 (DIV-06A-003 compartilhado com 10 e 21)
- **Handoffs necessários:**
  - Handoff para 10: Configuração de lifecycle rules para retenção de arquivos em S3.
  - Handoff para 15: Homologação das regras de sanitização de CSV Injection.
- **Riscos mais importantes:** A vulnerabilidade de CSV Injection em arquivos exportados representa um vetor de segurança real para clientes corporativos; o acúmulo de dados em memória ameaça a estabilidade do container em portais volumosos.
- **Recomendação final:** Aplicar imediatamente a sanitização de fórmulas no `exportFormatter.service.ts` e refatorar o loop de extração para streams.
