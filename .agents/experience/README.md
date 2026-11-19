# .agents/experience — Engenharia de Experiência, UX/UI e Arquitetura Visual

**Status:** IMPLEMENTADO (documentação e protocolos) · parcialmente PROPOSTA (aguarda decisão humana)
**Criado em:** 2026-11-18 pela missão master de expansão US/UX, executada pelo Agente 00.
**Autoridade:** `/AGENTS.md` permanece soberano. Nada aqui altera prompts protegidos, roster oficial ou propriedade de arquivos sem aprovação humana explícita.

## O que existe aqui

| Arquivo | Conteúdo | Fase da missão |
|---|---|---|
| `01-diagnostico.md` | Reconhecimento do repositório, inventário do frontend, análise de sobreposição | 0–2 |
| `02-arquitetura.md` | Arquitetura dos especialistas, decisão de estratégia, matriz de propriedade, protocolo de delegação e paralelismo | 3–4, 5 |
| `03-protocolo-auditoria-uxui.md` | Metodologia reutilizável de auditoria UX/UI (12 dimensões, schema de achado, severidades) | 6 |
| `04-templates-missao.md` | Templates de missão verificáveis por especialização + exemplos reais | 5 |
| `05-roadmap.md` | Ondas A–F de evolução da experiência | 8 |
| `propostas/` | Conteúdo pronto para `.agents/prompts/**`, `AGENTS.md` e `COMO-CHAMAR-OS-AGENTES.md` — **somente proposta, não aplicado** | 5 |

## Como o Agente 00 usa

1. Ao planejar uma onda com componente de experiência, consultar `02-arquitetura.md` para saber qual perfil especializar.
2. Escrever a missão com `04-templates-missao.md` e os critérios da especialização.
3. Para auditorias de tela, seguir `03-protocolo-auditoria-uxui.md` e gravar achados em `.agents/runs/auditorias-ux/`.
4. Encaminhar propostas pendentes de `propostas/` ao usuário para decisão humana antes de aplicar em arquivos protegidos.
5. Toda entrega continua exigindo parecer APROVADO do Agente 24 (§40 do AGENTS.md).

## Estado de implementação

- **Implementado agora:** toda a documentação desta pasta, os protocolos e os templates. Nenhum arquivo protegido foi modificado.
- **Aguardando aprovação humana:** os 4 perfis de missão do Agente 02 (02-UXR, 02-CJ, 02-IA, 02-CRO) como prompts oficiais em `.agents/prompts/`, o registro deles no roster do `AGENTS.md` e a seção correspondente em `COMO-CHAMAR-OS-AGENTES.md`. O enxame 03A–03G já existe e está homologado — ver `02-arquitetura.md` §3.
