/** Subconjunto da identidade (espelha `src/config/brand.ts` da plataforma). */
export const BRAND = {
  name: 'Birth Hub 360º',
  slogan: 'Aqui está o centro de comando da sua operação comercial',
  ecosystemLabel: 'Ecossistema de Alta Performance',
  description:
    'Conecte CRM, dados, processos e IA em um único Lugar. Monitore sua operação comercial em tempo real, identifique gargalos e transforme dados em ações executáveis.',
  credit: 'Desenvolvido pelo Coordenador Comercial Marcelo do Nascimento',
} as const;

/** URL da plataforma; sem a env, cai no caminho relativo (landing servida junto do app). */
export const APP_URL = (import.meta.env.VITE_APP_URL ?? '').replace(/\/$/, '');
export const LOGIN_URL = `${APP_URL}/login`;
