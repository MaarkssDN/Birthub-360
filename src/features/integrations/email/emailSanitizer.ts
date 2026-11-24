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

const MAX_TRACKING_URL_CHARS = 2048;

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
  // Recorte: `mailgun.org/.*/open` é quadrático num src gigante com o domínio repetido.
  const src = (srcAttr?.[1] ?? srcAttr?.[2] ?? srcAttr?.[3] ?? '').slice(0, MAX_TRACKING_URL_CHARS);
  if (src && TRACKING_URL_PATTERNS.test(src)) {
    return true;
  }

  return false;
}

// Uma única passada pode REMONTAR o que removeu (`<scr<script></script>ipt>`): por isso a
// sanitização inteira é repetida até não haver mais mudança.
const MAX_SANITIZE_PASSES = 20;

/**
 * Remove as tags abertas por `openRe` aprovadas por `shouldRemove` e, se houver `closeRe`, também o
 * conteúdo até o fechamento seguinte (ambos com flag `g`). Varredura linear de propósito: o regex equivalente
 * (`<tag\b[^>]*>[\s\S]*?</tag>`) é quadrático em `<tag` repetido sem fechamento (corpo de até 1 MB).
 */
function removeTag(
  input: string,
  openRe: RegExp,
  closeRe: RegExp | null,
  shouldRemove: (openTag: string) => boolean = () => true,
): string {
  let pendingCloseRe = closeRe;
  let out = '';
  let kept = 0;
  for (let open = openRe.exec(input); open; open = openRe.exec(input)) {
    const gt = input.indexOf('>', open.index);
    if (gt === -1) break;
    let end = gt + 1;
    openRe.lastIndex = end;
    if (!shouldRemove(input.slice(open.index, end))) continue;
    if (pendingCloseRe) {
      pendingCloseRe.lastIndex = end;
      if (pendingCloseRe.test(input)) end = pendingCloseRe.lastIndex;
      else pendingCloseRe = null;
    }
    out += input.slice(kept, open.index);
    kept = end;
    openRe.lastIndex = end;
  }
  return out + input.slice(kept);
}

// Um atributo como o tokenizador HTML o lê: separadores, nome e valor opcional (aspas sem
// fechamento vão até o fim do texto).
const ATTRIBUTE_RE =
  /[\t\n\f\r /]*([^\t\n\f\r />][^\t\n\f\r />=]*)(?:[\t\n\f\r ]*=[\t\n\f\r ]*("[^"]*(?:"|$)|'[^']*(?:'|$)|[^\t\n\f\r >]*))?/y;

/**
 * Remove atributos `on*=` só quando são NOME de atributo dentro de uma tag (nunca no texto nem em
 * valores como `href=".../onboarding=1"`), em varredura linear. `<` e `>` dentro de valores entre
 * aspas viram entidades (equivalentes ali), para que nenhum valor pulado possa abrir uma tag se o
 * navegador o ler em outro contexto (ex.: `<!--<a title="--><img src=x onerror=y>">`).
 */
function stripEventHandlers(input: string): string {
  const tagStartRe = /<\/?[a-z][^\t\n\f\r />]*/gi;
  let out = '';
  let pos = 0;
  while (tagStartRe.test(input)) {
    out += input.slice(pos, tagStartRe.lastIndex);
    pos = tagStartRe.lastIndex;
    ATTRIBUTE_RE.lastIndex = pos;
    for (let m = ATTRIBUTE_RE.exec(input); m; m = ATTRIBUTE_RE.exec(input)) {
      pos = ATTRIBUTE_RE.lastIndex;
      const [attribute, name, value] = m;
      if (value === undefined) out += attribute;
      else if (!/^on[a-z]/i.test(name)) {
        const isQuoted = value.startsWith('"') || value.startsWith("'");
        out += attribute.slice(0, attribute.length - value.length);
        out += isQuoted ? escapeAngles(value) : value;
      }
    }
    tagStartRe.lastIndex = pos;
  }
  return out + input.slice(pos);
}

function escapeAngles(input: string): string {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(input: string): string {
  return escapeAngles(input.replace(/&/g, '&amp;')).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeOnce(input: string): string {
  let clean = input;

  // 1. Remove blocos perigosos com seu conteúdo (<script>...</script>, <iframe>...</iframe>, etc.)
  for (const tag of DANGEROUS_BLOCK_TAGS) {
    const openRe = new RegExp(`<${tag}\\b`, 'gi');
    const closeRe = new RegExp(`</${tag}\\s*>`, 'gi');
    clean = removeTag(clean, openRe, closeRe);
  }

  // 2. Remove pixels espiões (<img ...> 1x1, 0x0, display:none, visibility:hidden ou URLs de tracker)
  clean = removeTag(clean, /<img\b/gi, null, isTrackingPixelImgTag);

  // 3. Remove atributos de eventos inline (onload=, onerror=, onclick=, etc.)
  clean = stripEventHandlers(clean);

  // 4. Neutraliza URIs javascript:, vbscript: e data:text/html em href/src/action
  clean = clean.replace(
    /\b(href|src|action|formaction)\s*=\s*(?:"\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"]*"|'\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^']*'|(?:javascript|vbscript|data\s*:\s*text\/html)[^\s>]+)/gi,
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
  // Não estabilizou em MAX_SANITIZE_PASSES: aninhamento só plausível em ataque, e o resto ainda pode
  // conter HTML ativo. Fail-safe: vira texto puro em vez de HTML parcialmente limpo.
  return escapeHtml(clean);
}
