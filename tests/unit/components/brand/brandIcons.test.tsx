import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import * as BrandIcons from '@/components/icons/BrandIcons';
import * as SectionIcons from '@/components/brand/title-icons/sectionIcons';
import {
  CompanyBadge,
  CompanyBrandIcon,
} from '@/components/brand/CompanyBrandIcon';

afterEach(cleanup);

function iconEntries(mod: Record<string, unknown>) {
  return Object.entries(mod).filter(
    ([name, value]) =>
      typeof value === 'function' && /^[A-Z]/.test(name) && !name.includes('Badge'),
  );
}

describe('BrandIcons (src/components/icons)', () => {
  const entries = iconEntries(BrandIcons as Record<string, unknown>);

  it.each(entries.map(([name]) => name))('%s renderiza um svg', (name) => {
    const Icon = (BrandIcons as Record<string, React.ComponentType>)[name];
    const { container } = render(<Icon data-testid={name} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('sectionIcons (src/components/brand/title-icons)', () => {
  const entries = iconEntries(SectionIcons as Record<string, unknown>);

  it.each(entries.map(([name]) => name))('%s renderiza respeitando size/color', (name) => {
    const Icon = (SectionIcons as Record<string, React.ComponentType>)[name];
    const { container } = render(<Icon size={48} color="#123456" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('CompanyBrandIcon', () => {
  it.each([
    ['WhatsApp', 'whatsapp'],
    ['Bitrix24', 'bitrix'],
    ['Gmail', 'gmail'],
    ['Google Calendar', 'calendar'],
    ['Google Workspace', 'workspace'],
    ['HubSpot', 'hubspot'],
    ['Pipedrive', 'pipedrive'],
    ['RD Station', 'rdstation'],
    ['Monday.com', 'monday'],
    ['Slack', 'slack'],
    ['Stripe', 'stripe'],
    ['Omie', 'omie'],
    ['3CX', '3cx'],
    ['Salesforce', 'salesforce'],
    ['Calendly', 'calendly'],
    ['Zoom', 'zoom'],
    ['Notion', 'notion'],
    ['Ferramenta Desconhecida XYZ', 'fallback'],
  ])('resolve %s → %s', (name) => {
    const { container } = render(<CompanyBrandIcon name={name} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('normaliza nomes com espaços, pontuação e caixa', () => {
    const { container } = render(<CompanyBrandIcon name="  WPP - OFICIAL  " />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('CompanyBadge', () => {
  it('renderiza label formatado com ícone', () => {
    render(<CompanyBadge name="Slack" label="Slack Technologies" />);
    expect(screen.getByText('Slack Technologies')).toBeInTheDocument();
  });

  it('usa o nome como label quando label não é informado', () => {
    render(<CompanyBadge name="Notion" />);
    expect(screen.getByText('Notion')).toBeInTheDocument();
  });
});
