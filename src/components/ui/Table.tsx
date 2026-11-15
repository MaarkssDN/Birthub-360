import * as React from 'react';

import { cn } from '../../lib/utils.js';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Rótulo acessível da região rolável horizontal (WCAG 2.1.1). O wrapper `overflow-auto`
   * precisa ser focável por teclado — axe `scrollable-region-focusable` — e nomeado para o
   * usuário de leitor de tela saber o que está prestes a rolar.
   */
  scrollRegionLabel?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, scrollRegionLabel = 'Área com rolagem horizontal', ...props }, ref) => (
    // biome-ignore lint/a11y/useSemanticElements: região rolável genérica de propósito — section/fieldset criariam landmark/semântica de formulário indevida (mesmo padrão de CrmBoard.tsx).
    <div
      role="group"
      aria-label={scrollRegionLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll horizontal precisa ser focável por teclado (axe scrollable-region-focusable, WCAG 2.1.1).
      tabIndex={0}
      className="relative w-full overflow-auto rounded-2xl border border-line bg-surface shadow-sm"
    >
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  ),
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('[&_tr]:border-b border-line bg-surface-2/60', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-line bg-surface-2/60 font-medium [&>tr]:last:border-b-0',
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-line transition-colors hover:bg-surface-interactive data-[state=selected]:bg-brand/10',
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    // Cabeçalho de coluna por padrão (uso em <thead>); quem usar TableHead como
    // cabeçalho de linha (<tbody>) deve passar scope="row" explicitamente.
    scope="col"
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-ink-2 [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle text-ink [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-ink-2', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
