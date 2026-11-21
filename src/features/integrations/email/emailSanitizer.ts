/**
 * Sanitização de corpo de e-mail inbound (Agente 55 — Ícaro).
 *
 * Remove scripts executáveis, iframes/embeds, handlers inline (`onload`, `onerror`, etc.),
 * URIs `javascript:`/`vbscript:` e pixels espiões de rastreamento (imagens 1x1, 0x0 ou ocultas
 * por CSS `display:none`/`visibility:hidden`/`opacity:0`) antes de armazenar no banco.
 */

const DANGEROUS_BLOCK_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'style',
  'form',
  'base',
];

const TRACKING_URL_PATTERNS =
  /(?:open\.substack\.com|list-manage\.com\/track\/open|mandrillapp\.com\/track\/open|sendgrid\.net\/wf\/open|mailgun\.org\/.*\/open|\/pixel(?:\.[a-z]+|\b)|track(?:ing)?[-_.]?pixel|\/beacon[./?])/i;

function isTrackingPixelImgTag(imgTag: string): boolean {
  const lower = imgTag.toLowerCase();

  // Dimensões explícitas 0 ou 1 em atributos HTML (width="1", height='0', width=1px, etc.)
  const widthAttr = lower.match(/\bwidth\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/);
  const heightAttr = lower.match(/\bheight\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/);
  const wVal = (widthAttr?.[1] ?? widthAttr?.[2] ?? widthAttr?.[3] ?? '').trim();
  const hVal = (heightAttr?.[1] ?? heightAttr?.[2] ?? heightAttr?.[3] ?? '').trim();

  const isTinyDim = (v: string) => /^(?:0|1)(?:px)?$/.test(v);
  if (isTinyDim(wVal) || isTinyDim(hVal)) {
    return true;
  }

  // Estilo inline ocultando ou reduzindo a imagem a 1x1 / 0x0
  const styleAttr = lower.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/);
  const style = styleAttr?.[1] ?? styleAttr?.[2] ?? '';
  if (style) {
    if (/display\s*:\s*none/.test(style)) return true;
    if (/visibility\s*:\s*hidden/.test(style)) return true;
    if (/opacity\s*:\s*0(?:\.0+)?(?:\s*;|\s*$)/.test(style)) return true;
    if (/(?:^|;|\s)(?:max-)?(?:width|height)\s*:\s*(?:0|1)px\b/.test(style)) return true;
  }

  // URLs conhecidas de pixel de abertura
  const srcAttr = lower.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/);
  const src = srcAttr?.[1] ?? srcAttr?.[2] ?? srcAttr?.[3] ?? '';
  if (src && TRACKING_URL_PATTERNS.test(src)) {
    return true;
  }

  return false;
}

// Uma única passada de `replace` pode REMONTAR o que removeu (`<scr<script></script>ipt>`,
// `oonnerror=`): por isso cada passada é repetida até não haver mais mudança.
const MAX_SANITIZE_PASSES = 20;

function sanitizeOnce(input: string): string {
  let clean = input;

  // 1. Remove blocos perigosos com seu conteúdo (<script>...</script>, <iframe>...</iframe>, etc.)
  for (const tag of DANGEROUS_BLOCK_TAGS) {
    const pairedRe = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi');
    const selfClosingRe = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    clean = clean.replace(pairedRe, '').replace(selfClosingRe, '');
  }

  // 2. Remove pixels espiões (<img ...> 1x1, 0x0, display:none, visibility:hidden ou URLs de tracker)
  clean = clean.replace(/<img\b[^>]*>/gi, (match) => (isTrackingPixelImgTag(match) ? '' : match));

  // 3. Remove atributos de eventos inline (onload=, onerror=, onclick=, etc.).
  // O separador pode ser espaço OU "/" (`<img/onerror=x>` é executado pelos navegadores).
  clean = clean.replace(/[\s/]+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 4. Neutraliza URIs javascript:, vbscript: e data:text/html em href/src/action
  clean = clean.replace(
    /\b(href|src|action|formaction)\s*=\s*(?:"\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"]*"|'\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^']*'|(?:\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^\s>]+))/gi,
    '$1=""',
  );

  return clean;
}

export function sanitizeInboundEmailBody(rawBody: string | null | undefined): string {
  if (!rawBody) return '';

  let clean = rawBody;
  for (let pass = 0; pass < MAX_SANITIZE_PASSES; pass++) {
    const next = sanitizeOnce(clean);
    if (next === clean) return clean;
    clean = next;
  }
  return clean;
}
