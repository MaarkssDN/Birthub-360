export interface ProductModule {
  key: string;
  label: string;
  description: string;
  iconName: string;
  colorTheme: string;
  alwaysActive?: boolean;
}

export const PRODUCT_MODULES: ProductModule[] = [
  {
    key: 'crm-comercial',
    label: 'CRM Comercial',
    description: 'Gestão de leads e funil de vendas.',
    iconName: 'LayoutTemplate',
    colorTheme: 'bg-blue-100 text-blue-600',
    alwaysActive: true,
  },
  {
    key: 'social-selling',
    label: 'Social Selling',
    description: 'Prospecção ativa e vendas sociais.',
    iconName: 'Globe',
    colorTheme: 'bg-green-100 text-green-600',
  },
  {
    key: 'hub-inteligencia',
    label: 'Hub de Inteligência',
    description: 'Análise de dados e insights com IA.',
    iconName: 'Cpu',
    colorTheme: 'bg-purple-100 text-purple-600',
  },
];

export type ProductModuleKey = string;
