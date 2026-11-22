# Baseline e conectividade — 00 — 2026-10-09
Base: e32bad52df6d45bad35433878067d13c768cd1ca, checkout original main sem alterações prévias.

| Verificação | Código | Resultado real |
|---|---:|---|
| npx tsc --noEmit | 0 | PASS |
| npm run lint | 0 | PASS com 338 warnings e 1 info pré-existentes |
| npm run build | 0 | PASS frontend/server/PWA |
| npm run test:architecture | 0 | PASS; 76 baseline entries obsoletas informadas, nenhuma regra alterada |
| Testes focados prospecção (32 arquivos) | 0 | 274 PASS |
| npm run test:unit global | pendente | execução inicial ainda em andamento; não declarado PASS |
| npm run test:integration | 1 | pretest interrompido: Docker CLI inicialmente indisponível, sem banco real |
| npm run test:e2e | 1 | pretest interrompido pelo mesmo motivo |
| npm run verify:integrations / verify:ai | não executado | scripts também geram chamadas faturáveis; orçamento real/infra ainda indisponíveis |

Logs verbosos locais excluídos somente via .git/info/exclude, sem segredos copiados para código ou relatório.

## Conectividade controlada (nenhuma geração/enriquecimento pago)
- Apollo GET auth/health HTTP200. Valida autenticação; NÃO prova escopo, créditos ou funcionamento de busca/enrichment.
- Groq GET models HTTP200, 11 modelos. NÃO prova geração, inferência ou disponibilidade sob cota.
- BrasilAPI: consulta CNPJ válido por serviço real encontrou dados cadastrais. Header transparente BirthHub360/1.0 (CNPJ lookup) HTTP200; fetch Node padrão deu403. Não foi necessário simular navegador.
- Ollama e SearXNG indisponíveis nos endpoints configurados. Postgres local TCP indisponível. Google configurado mas não testado: Text Search pode cobrar e orçamento não foi comprovado.
- Credenciais Apollo/Google/Groq já presentes no .env. PDF autorizado lido somente para identificar presença das credenciais relevantes, sem exibir ou copiar conteúdo/segredos. Hunter ausente.

## Atualização do ambiente pelo usuário
O usuário instalou Docker Desktop nesta máquina durante o trabalho. CLI29.8.1 e Desktop4.93.0 detectados no diretório de programas do usuário, PATH do processo anterior não atualizado. Backend não subiu: WSL E_ACCESSDENIED ao disco configurado em caminho UNC da OUTRA máquina. Uma tentativa de restart com timeout30 falhou; start posterior revelou o erro de mount, confirmado pela imagem enviada. Nenhum disco foi movido, removido ou editado; configuração Docker permanece intacta.

O usuário decidiu instalar Docker na outra máquina. Conexão futura deve usar Docker context via SSH e serviços via rede/túneis; nunca montar o VHDX remoto como se fosse disco local. Host/SO/SSH ainda pendentes, solicitados sem pedir senha/chave. Testes DB/E2E permanecem bloqueados até o serviço remoto estar disponível.

## Decisão de reutilização
Existe catálogo CNPJ pronto no domínio Market Intelligence (MarketIntelligenceCompany, dataset CNPJ_ACTIVE READY, busca razão social/nome fantasia/CNAE/UF/município/page). Será reutilizado pelo Turbo via DI composition root existente. Sem import cruzado de internals, sem base duplicada ou dependência/migration nova. Adapter05 preserva somente dataOrigin OBSERVED e metadados snapshot. Registro composition root pertence01 e aguarda slot; contratos legados tests pertencem08 e estão sendo ajustados por08.
