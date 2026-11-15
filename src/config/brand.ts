/**
 * Identidade da plataforma — fonte de verdade única em código.
 *
 * Espelha `identidade-visual/birthhub360/` (Brandbook, Manual Visual, Manual de Produto e Catálogo oficiais de 2026). Qualquer texto institucional da aplicação (título da aba,
 * cabeçalho do login, assinatura de e-mail, prompt de IA, splash) sai daqui —
 * não escreva "Birth Hub 360" solto num componente.
 *
 * Antes deste arquivo a identidade vinha de `BRAND_CONFIGS` em
 * `src/contexts/BrandContext.tsx`, um mapa de DUAS marcas trocadas em runtime.
 * A plataforma tem uma marca só agora; o que era "marca ativa" e de fato
 * segmentava conteúdo comercial (playbook, personas, matriz de objeções) virou
 * dado da área comercial, configurável por empresa — ver
 * `src/features/playbook/`.
 *
 * Cores: use os tokens (`bg-brand`, `text-ink`…) em componentes. Os hex abaixo
 * existem para os contextos que não têm CSS — `<meta name="theme-color">`,
 * geração de imagem/PDF, canvas, e-mail transacional.
 */
export const BRAND = {
  id: 'birthhub360',
  /** Nome institucional completo, com o grau. Use em títulos e assinaturas. */
  name: 'Birth Hub 360º',
  /** Sem o grau — para espaços estreitos (sidebar recolhida, chip, breadcrumb). */
  shortName: 'Birth Hub',
  /** O que a plataforma é, em uma linha. */
  slogan: 'Sua central de comando inteligente',
  /** Assinatura completa do brand book (p. 01 e p. 10). */
  tagline:
    'Sua central de comando inteligente: integrando dados, potencializando decisões e acelerando a execução.',
  /** Subtítulo institucional sob o wordmark na tela de entrada (`WelcomeScreen`). */
  ecosystemLabel: 'Ecossistema de Alta Performance',
  description:
    'Ecossistema inteligente e unificado que atua como central de comando 360º para negócios — conectando dados, IA, automações e processos, e transformando o que está disperso em direção clara.',
  /** Os três movimentos da marca: dados → decisões → execução (brand book, p. 02). */
  pillars: ['Inteligência', 'Conexão', 'Execução'] as const,
  /** Valores (brand book, p. 10). Em inglês no original. */
  values: ['Innovation', 'Data Intelligence', 'Efficiency', 'Scalability'] as const,
  colors: {
    /** Orbit Blue #1677FF: Tecnologia, confiança, inovação */
    neonBlue: '#1677FF',
    /** Antique Gold #D4AF37: ação primária da marca */
    brand: '#D4AF37',
    brandAccent: '#D4AF37',
    /** Rosa #FF4FA3 (variante clara do rosa oficial #DB2777): energia, criatividade, atitude */
    neonPink: '#FF4FA3',
    pink: '#FF4FA3',
    /** Deep Iris #7C3AED */
    redViolet: '#7C3AED',
    /** Antique Gold #D4AF37: sofisticação, prosperidade, previsibilidade e métricas */
    neonGold: '#D4AF37',
    gold: '#D4AF37',
    /** Deep Navy #061A3A: âncora escura (substitui o antigo "Preto Neon" #0D0D0D) */
    neonBlack: '#061A3A',
    obsidian: '#061A3A',
    midnight: '#061A3A',
    /** Blossom White #FFF4F9: âncora clara (substitui o antigo "Branco Neon" #F8F9FF) */
    neonWhite: '#FFF4F9',
    white: '#FFF4F9',
    snow: '#FFF4F9',
    blossom: '#FFF4F9',
    /** Superfícies derivadas de Deep Navy (tema escuro) */
    neonCardBg: '#0E2450',
    surface: '#0E2450',
    card: '#0E2450',
    /** Bordas Glow (Orbit Blue) */
    neonCardBorder: 'rgba(22, 119, 255, 0.22)',
    glowBorder: 'rgba(22, 119, 255, 0.22)',
    /** Tons Light complementares (variantes escuras para tema claro) */
    lightPink: '#DB2777',
    lightBlue: '#1668D8',
    lightGold: '#B8962E',
    /** Semânticos complementares — vermelho oficial #E11D48 */
    sunsetOrange: '#E11D48',
    red: '#E11D48',
    iris: '#7C3AED',
    orbitBlue: '#1677FF',
  },
  /**
   * Perfis sociais da plataforma.
   *
   * Vazio de propósito: os perfis que existiam aqui eram os de uma marca anterior
   * (Facebook, Instagram, LinkedIn e YouTube) — canais de outra empresa, que não
   * podem seguir assinando esta plataforma. A lista renderiza sozinha assim que
   * os perfis da Birth Hub 360 forem preenchidos.
   */
  social: [] as ReadonlyArray<{
    href: string;
    label: 'Facebook' | 'Instagram' | 'LinkedIn' | 'YouTube';
  }>,
  /** Crédito institucional exibido na tela de entrada. */
  credit: 'Desenvolvido pelo Coordenador Comercial Marcelo do Nascimento',
  logos: {
    /** Emblema completo. ≥ 96 px. */
    symbol: '/brand/birthhub360-simbolo.svg',
    /** Redução estrutural para ícone/favicon/avatar. 32–96 px. */
    icon: '/brand/birthhub360-icone.svg',
    /** Emblema + logotipo. Assinatura institucional. */
    horizontal: '/brand/birthhub360-logo-horizontal.svg',
  },
} as const;

export type BrandInfo = typeof BRAND;
