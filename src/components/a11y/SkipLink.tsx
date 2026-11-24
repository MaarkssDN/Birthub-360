/**
 * SkipLink — WCAG 2.2 AA, critério 2.4.1 (Bypass Blocks).
 *
 * Primeiro elemento focável do shell: fica visualmente oculto até receber
 * foco por teclado (`sr-only` + `focus:not-sr-only`) e leva o usuário direto
 * ao `<main id="main-content">` montado por `MainLayout`, ignorando sidebar,
 * topbar e widgets flutuantes.
 *
 * O alvo usa `tabIndex={-1}` para ser focável sem entrar na ordem de tab
 * natural. Como `<main>` é o próprio container de scroll
 * (`overflow-y-auto`), o `onClick` também o devolve ao topo — o salto de
 * fragmento nativo não reseta a posição de scroll interna do container.
 */
export function SkipLink() {
  return (
    // biome-ignore lint/a11y/useValidAnchor: skip link é navegação de fragmento in-page intencional (WCAG 2.4.1)
    <a
      href="#main-content"
      onClick={() => {
        requestAnimationFrame(() => {
          document.getElementById('main-content')?.scrollTo({ top: 0 });
        });
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-brand focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-focus-ring"
    >
      Pular para o conteúdo principal
    </a>
  );
}
