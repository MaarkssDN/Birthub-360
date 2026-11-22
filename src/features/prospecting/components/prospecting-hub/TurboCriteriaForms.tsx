import { useEffect, useState } from 'react';
import type { ProspectCriteria } from '../../domain/prospectTypes.js';

const inputStyle =
  'w-full min-w-0 p-3 bg-surface rounded-xl border border-line focus:border-brand focus:ring-1 focus:ring-brand text-sm text-ink';

export function TurboField({
  id,
  label,
  value,
  onChange,
  list,
  maxLength,
  type = 'text',
}: {
  id: string;
  label: string;
  value?: string | number;
  onChange: (value: string) => void;
  list?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <label htmlFor={id} className="block space-y-1 text-xs text-ink-2">
      <span>{label}</span>
      <input
        id={id}
        type={type}
        list={list}
        maxLength={maxLength}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputStyle}
      />
    </label>
  );
}

function ValuesField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string[];
  onChange: (value: string[]) => void;
}) {
  const serialized = (value ?? []).join(', ');
  const [draft, setDraft] = useState(serialized);
  useEffect(() => setDraft(serialized), [serialized]);
  return (
    <label htmlFor={id} className="block space-y-1 text-xs text-ink-2">
      <span>{label} (um por linha ou separados por vírgula)</span>
      <textarea
        id={id}
        value={draft}
        rows={2}
        disabled={id === 'segment-cnaesSecundarios'}
        className={inputStyle}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() =>
          onChange([
            ...new Set(
              draft
                .split(/[,\n]/)
                .map((v) => v.trim())
                .filter(Boolean),
            ),
          ])
        }
      />
    </label>
  );
}

export function SegmentDetailsForm({
  criteria,
  setCriteria,
}: {
  criteria: ProspectCriteria;
  setCriteria: (criteria: ProspectCriteria) => void;
}) {
  const details = criteria.segmentoDetalhes ?? {};
  const update = (patch: Partial<NonNullable<ProspectCriteria['segmentoDetalhes']>>) =>
    setCriteria({ ...criteria, segmentoDetalhes: { ...details, ...patch } });
  const textFields = [
    ['subsegmento', 'Subsegmento'],
    ['nicho', 'Nicho de mercado'],
    ['descricaoIdeal', 'Descrição da empresa ideal'],
    ['cnaePrincipal', 'CNAE principal'],
    ['setorEconomico', 'Setor econômico'],
    ['tipoMercado', 'Tipo de mercado'],
    ['modeloNegocio', 'Modelo de negócio'],
    ['descricaoPesquisa', 'Descrição personalizada da pesquisa'],
  ] as const;
  const valueFields = [
    ['produtos', 'Produtos comercializados'],
    ['servicos', 'Serviços oferecidos'],
    ['palavrasObrigatorias', 'Palavras-chave obrigatórias'],
    ['palavrasOpcionais', 'Palavras-chave opcionais'],
    ['palavrasExcluir', 'Palavras-chave a excluir'],
    ['cnaesSecundarios', 'CNAEs secundários — indisponível no catálogo atual'],
  ] as const;
  return (
    <details className="space-y-3">
      <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">
        Detalhar segmento e atividade
      </summary>
      <p className="text-xs text-ink-2">
        Descrições ajudam a planejar a pesquisa. Critérios não confirmados pela fonte permanecem
        sinalizados nos resultados; CNAE depende de uma fonte cadastral disponível.
      </p>
      {textFields.map(([key, label]) => (
        <TurboField
          key={key}
          id={`segment-${key}`}
          label={label}
          value={details[key]}
          onChange={(value) => update({ [key]: value || undefined })}
        />
      ))}
      {valueFields.map(([key, label]) => (
        <ValuesField
          key={key}
          id={`segment-${key}`}
          label={label}
          value={details[key]}
          onChange={(value) => update({ [key]: value })}
        />
      ))}
    </details>
  );
}

const templates = [
  'Proprietário',
  'Fundador',
  'Sócio',
  'CEO',
  'CFO',
  'COO',
  'CTO',
  'CMO',
  'Diretor Comercial',
  'Diretor Financeiro',
  'Diretor de Marketing',
  'Diretor de Operações',
  'Gerente Comercial',
  'Gerente de Compras',
  'Head de Vendas',
  'Head de Marketing',
  'Responsável por Tecnologia',
  'Responsável por Contratações',
];

export function PersonaForm({
  criteria,
  setCriteria,
}: {
  criteria: ProspectCriteria;
  setCriteria: (criteria: ProspectCriteria) => void;
}) {
  const personas = criteria.personas ?? [];
  const update = (
    index: number,
    patch: Partial<NonNullable<ProspectCriteria['personas']>[number]>,
  ) =>
    setCriteria({
      ...criteria,
      personas: personas.map((persona, i) => (i === index ? { ...persona, ...patch } : persona)),
    });
  return (
    <fieldset className="space-y-3 border-t border-line pt-3">
      <legend className="text-sm font-semibold text-ink">Personas do decisor</legend>
      <label htmlFor="persona-template" className="block text-xs text-ink-2">
        Adicionar modelo de persona
        <select
          id="persona-template"
          className={inputStyle}
          value=""
          onChange={(e) => {
            if (e.target.value)
              setCriteria({
                ...criteria,
                personas: [
                  ...personas,
                  { nome: e.target.value, cargoPrincipal: e.target.value, limite: 3 },
                ],
              });
          }}
        >
          <option value="">Selecionar modelo</option>
          {templates.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      {personas.map((persona, index) => (
        <details key={index} open className="rounded-xl border border-line p-3 space-y-3">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            {persona.nome || `Persona ${index + 1}`}
          </summary>
          {(['nome', 'cargoPrincipal', 'palavrasChave', 'descricao'] as const).map((key, i) => (
            <TurboField
              key={key}
              id={`persona-${index}-${key}`}
              label={
                [
                  'Nome da persona',
                  'Cargo principal',
                  'Palavras-chave profissionais',
                  'Descrição personalizada',
                ][i]
              }
              value={persona[key]}
              onChange={(value) => update(index, { [key]: value || undefined })}
            />
          ))}
          {(
            [
              'cargosEquivalentes',
              'cargosExcluir',
              'departamentos',
              'senioridades',
              'localizacoes',
            ] as const
          ).map((key, i) => (
            <ValuesField
              key={key}
              id={`persona-${index}-${key}`}
              label={
                [
                  'Cargos equivalentes',
                  'Cargos a excluir',
                  'Departamentos',
                  'Senioridades (owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern)',
                  'Localizações',
                ][i]
              }
              value={persona[key]}
              onChange={(value) => update(index, { [key]: value })}
            />
          ))}
          <TurboField
            id={`persona-${index}-limite`}
            label="Decisores desejados por empresa (1 a 10)"
            type="number"
            value={persona.limite ?? 3}
            onChange={(value) =>
              update(index, { limite: Math.min(10, Math.max(1, Number(value) || 1)) })
            }
          />
          <p className="text-xs text-ink-2">
            Função, poder de decisão, área de responsabilidade, experiência, tempo no cargo/empresa
            e competências: indisponíveis como filtros nos provedores atuais. Inclua contexto na
            descrição para análise, sem garantia de filtragem.
          </p>
          <button
            type="button"
            className="py-2 text-xs text-danger-active dark:text-ink"
            onClick={() =>
              setCriteria({ ...criteria, personas: personas.filter((_, i) => i !== index) })
            }
          >
            Remover persona {index + 1}
          </button>
        </details>
      ))}
      <button
        type="button"
        className="w-full py-3 rounded-xl border border-dashed border-line text-sm text-ink"
        onClick={() =>
          setCriteria({
            ...criteria,
            personas: [...personas, { nome: '', cargoPrincipal: '', limite: 3 }],
          })
        }
      >
        Adicionar persona personalizada
      </button>
    </fieldset>
  );
}
