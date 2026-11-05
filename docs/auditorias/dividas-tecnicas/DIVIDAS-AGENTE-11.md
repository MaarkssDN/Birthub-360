# Relatório de Auditoria de Dívidas Técnicas — Agente 11

## IDENTIFICAÇÃO
- **ID do agente:** 11
- **Nome oficial:** Marca e Ativos Institucionais
- **Especialização:** Identidade visual canônica Birth Hub 360°, Brand Constitution, erradicação de marcas comerciais legadas, gestão de ativos visuais em SVG/PNG/WebP, manuais de aplicação de logo e governança tipográfica
- **Responsabilidades:** Propriedade exclusiva dos diretórios `identidade-visual/**` e `documentacao-aplicacao/**` (`AGENTS.md` §15), preservação da integridade da marca Birth Hub 360°, eliminação de referências legadas no código e documentos, padronização de favicons, badges, open-graph e manuais institucionais.
- **Branch e commit analisados:** `main` @ `8215727eb3f9e6c5e9b4fc090164969b86f7bad0`
- **Data da avaliação:** 2026-11-04
- **Escopo investigado:** `docs/BrandConstitution.md`, `identidade-visual/**`, `public/brand/**`, `public/icons/**`, `src/components/brand/**`, varredura textual de referências de marca.

---

## INVENTÁRIO DO DOMÍNIO
- **Módulos sob responsabilidade:** Catálogo de logos vetoriais (SVG), iconografia institucional, especificações de cores corporativas (Dourado Champagne, Azul Cósmico, Preto Ônix), manuais de tom de voz e assets gráficos.
- **Arquivos relevantes:**
  - `docs/BrandConstitution.md` (constituição oficial da marca)
  - `src/components/brand/BrandLogo.tsx`
  - `src/components/brand/title-icons/flowIcons.tsx`
  - `public/brand/**`
  - `public/favicon.ico`
- **Serviços existentes:** Verificador de higiene de marca (`brand-hygiene`), otimizador de imagens vetoriais.
- **APIs e integrações:** Assets estáticos servidos via CDN e Express static middleware.
- **Funcionalidades implementadas:** Logotipo responsivo, paleta cromática de luxo corporativo, badges de certificação de segurança e IA.
- **Testes encontrados:** `tests/unit/brand-hygiene.test.ts`, inspeção de tokens de marca.
- **Dependências externas:** Nenhuma (assets puros).

---

## DÍVIDAS TÉCNICAS IDENTIFICADAS

### ID: DIV-11-001
- **Título:** Ocorrências residuais de menções a marcas legadas em fixtures de testes e documentações internas
- **Categoria:** Governança de Marca e Comunicação
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `docs/reports/**`, fixtures em `tests/fixtures/**`
- **Evidência:** Embora a Issue #134 tenha erradicado os termos legados dos códigos de produção (`src/`), uma varredura por expressões regulares localizou ocorrências residuais de nomes comerciais antigos em arquivos markdown históricos de auditorias e fixtures de testes legados.
- **Problema:** A persistência de termos antigos em documentações de arquitetura gera confusão para novos desenvolvedores e contradiz a unicidade de marca estabelecida na `BrandConstitution.md`.
- **Causa raiz:** O script de busca anterior focou apenas nos diretórios `src/` e `prisma/`, poupando arquivos em pastas de relatórios arquivados.
- **Impacto:** Ruído conceitual em documentações e possível vazamento de nomes legados em logs de testes.
- **Correção necessária:** Executar o script de saneamento de marca sobre o diretório `docs/` e `tests/fixtures/`, substituindo nomes legados pela denominação canônica Birth Hub 360° ou marcando-os explicitamente como referências históricas obsoletas.
- **Agente proprietário:** 11
- **Agentes dependentes:** 18 (Documentação Viva)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** `git grep -i "termo_legado"` não retorna nenhuma ocorrência em arquivos de documentação ativa ou testes correntes.
- **Teste necessário:** Execução de `npm run test:unit` incluindo a validação do `brand-hygiene.test.ts`.
- **Dependências:** Nenhuma.

### ID: DIV-11-002
- **Título:** Ativos institucionais pesados em public sem compressão moderna lossless (WebP/SVG minificado)
- **Categoria:** Performance e Ativos Visuais
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `public/brand/**`, `public/og-image.png`
- **Evidência:** Arquivos de imagem como `og-image.png` (compartilhamento social) e logos em PNG na pasta `public/` possuem mais de 1.8MB cada, contendo metadados EXIF e ausência de versões comprimidas em formato moderno WebP ou AVIF.
- **Problema:** O carregamento da landing page e o compartilhamento de links da plataforma consomem banda desnecessária, aumentando o tempo de Largest Contentful Paint (LCP) em conexões móveis.
- **Causa raiz:** Exportação direta de ferramentas de design (Figma/Photoshop) sem passagem por ferramentas de otimização de imagem (ImageMin / Sharp).
- **Impacto:** Degradação no score de performance do Google Lighthouse e lentidão no carregamento de logos em dispositivos móveis.
- **Correção necessária:** Processar todas as imagens em `public/brand/` utilizando compressão sem perdas (lossless) e gerar versões WebP otimizadas com tamanho inferior a 200KB.
- **Agente proprietário:** 11
- **Agentes dependentes:** 03 (Design System), 09 (Mobile)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** O arquivo `og-image.png` / `og-image.webp` possui tamanho inferior a 250KB com qualidade visual preservada.
- **Teste necessário:** Auditoria Lighthouse de performance na landing page verificando economia de dados em imagens.
- **Dependências:** Nenhuma.

### ID: DIV-11-003
- **Título:** Divergência de nomenclatura entre tokens de cores na BrandConstitution e variáveis Tailwind
- **Categoria:** Consistência e Design System
- **Severidade:** Baixa
- **Status:** Confirmada
- **Localização:** `docs/BrandConstitution.md`, `src/styles/globals.css`
- **Evidência:** O manual `BrandConstitution.md` define a cor primária como `BirthHub Luxury Gold (#D4AF37)` com código token `color.brand.gold`, enquanto o CSS global utiliza `--color-brand-primary: #0284c7` (tom azulado) herdado do tema anterior e mapeia o dourado como classe auxiliar separada.
- **Problema:** Desenvolvedores e designers utilizam nomes de variáveis diferentes para expressar a cor primária da marca, gerando telas com discrepâncias cromáticas entre azul corporativo e dourado nobre.
- **Causa raiz:** Evolução da identidade visual documentada na Brand Constitution que foi apenas parcialmente refletida na hierarquia das variáveis CSS globais.
- **Impacto:** Dificuldade de manter fidelidade estrita ao manual de marca em novas páginas e componentes.
- **Correção necessária:** Alinhar as definições da `BrandConstitution.md` com os tokens do `globals.css`, estabelecendo o papel exato do Ouro Nobre e do Azul Cósmico na hierarquia do sistema de design.
- **Agente proprietário:** 11
- **Agentes dependentes:** 03 (Design System)
- **Complexidade:** Pequena (< 1 dia)
- **Prioridade:** P3
- **Critério de aceite:** Mapeamento 1:1 entre as cores descritas na `BrandConstitution.md` e as variáveis em `globals.css`.
- **Teste necessário:** Verificação automatizada de paridade de tokens de design.
- **Dependências:** Alinhamento com Agente 03.

---

## DIAGNÓSTICO DE MATURIDADE
- **Cobertura funcional:** Alta (Brand Constitution detalhada e presença de biblioteca de componentes visuais).
- **Cobertura automatizada de testes:** Alta (teste de higiene de marca `brand-hygiene.test.ts` implementado).
- **Segurança:** Alta (sem impactos de segurança no domínio de marca).
- **Arquitetura:** Alta (assets isolados em diretórios próprios).
- **Confiabilidade:** Alta (logotipos e componentes de marca estáveis).
- **Observabilidade:** Não aplicável.
- **Manutenibilidade:** Alta (documentação rica e centralizada).

---

## PLANO DE SANEAMENTO
1. **Bloqueadores críticos:** Nenhum bloqueador P0 identificado.
2. **Segurança e integridade de dados:** Não aplicável ao domínio de marca.
3. **Falhas funcionais:** Não aplicável.
4. **Confiabilidade:** Otimizar e comprimir assets de imagem em `public/brand/` (DIV-11-002).
5. **Testes:** Expandir o `brand-hygiene.test.ts` para cobrir pastas de fixtures e relatórios.
6. **Arquitetura:** Sincronizar nomenclaturas de tokens entre `BrandConstitution.md` e Tailwind (DIV-11-003).
7. **Melhorias estruturais:** Erradicar resíduos textuais legados em documentações históricas (DIV-11-001).

---

## CONCLUSÃO DO AGENTE
- **Quantidade total de dívidas identificadas:** 3
- **Quantidade por severidade:** 0 Críticas, 0 Altas, 0 Médias, 3 Baixas
- **Quantidade confirmada:** 3
- **Quantidade não verificável:** 0
- **Problemas de responsabilidade exclusiva:** 2 (DIV-11-001, DIV-11-002)
- **Problemas compartilhados:** 1 (DIV-11-003 compartilhado com 03)
- **Handoffs necessários:**
  - Handoff para 03: Alinhamento de tokens cromáticos no `globals.css`.
- **Riscos mais importantes:** A existência de nomenclaturas conflitantes de cores pode degradar a harmonia visual da plataforma; imagens pesadas afetam o tempo de abertura da landing page.
- **Recomendação final:** Otimizar as imagens em `public/` e consolidar a hierarquia de cores entre a documentação e os estilos CSS.
