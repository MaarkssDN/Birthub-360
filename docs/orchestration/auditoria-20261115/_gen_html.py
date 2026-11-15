#!/usr/bin/env python3
"""Gera HTML de auditoria a partir de 00-CONSOLIDADO.md + inventário de relatórios."""
import html, re, sys
from pathlib import Path

SRC = Path(r"C:\Github\Birthub-360\docs\orchestration\auditoria-20261115")
OUT = Path(r"C:\Users\Marks\Desktop\auditoria-geral-20261115.html")

def inline(t):
    t = html.escape(t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    return t

def md_to_html(md):
    lines = md.splitlines()
    out, i = [], 0
    while i < len(lines):
        l = lines[i]
        if l.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s\-|]+\|$", lines[i+1]):
            header = [c.strip() for c in l.strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip("|").split("|")])
                i += 1
            out.append("<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in header) + "</tr></thead><tbody>")
            for r in rows:
                out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
            out.append("</tbody></table>")
            continue
        m = re.match(r"^(#{1,4})\s+(.*)", l)
        if m:
            lvl = len(m.group(1))
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
        elif l.strip() == "---":
            out.append("<hr>")
        elif re.match(r"^[-*]\s+", l):
            out.append("<ul>")
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i]):
                out.append(f"<li>{inline(re.sub(r'^[-*]\s+', '', lines[i]))}</li>")
                i += 1
            out.append("</ul>")
            continue
        elif l.strip():
            out.append(f"<p>{inline(l)}</p>")
        i += 1
    return "\n".join(out)

md = (SRC / "00-CONSOLIDADO.md").read_text(encoding="utf-8")
reports = sorted(p.name for p in SRC.glob("*.md") if p.name != "00-CONSOLIDADO.md")

page = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Auditoria Geral 2026-11-15 — Birth Hub 360</title>
<style>
:root {{ --bg:#0B132B; --panel:#111C36; --line:#26365c; --txt:#E8EDF7; --mut:#9FB0D0; --acc:#38BDF8; --p0:#F87171; --p1:#FBBF24; --ok:#34D399; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; font-family:'Inter',system-ui,sans-serif; background:var(--bg); color:var(--txt); line-height:1.6; }}
header {{ padding:48px 24px 24px; max-width:1100px; margin:0 auto; }}
h1 {{ font-size:1.9rem; margin:0 0 8px; }}
.sub {{ color:var(--mut); }}
main {{ max-width:1100px; margin:0 auto; padding:0 24px 64px; }}
h2 {{ border-bottom:1px solid var(--line); padding-bottom:6px; margin-top:40px; }}
h3 {{ color:var(--acc); margin-top:28px; }}
table {{ border-collapse:collapse; width:100%; margin:16px 0; font-size:.9rem; }}
th,td {{ border:1px solid var(--line); padding:8px 10px; text-align:left; vertical-align:top; }}
th {{ background:var(--panel); }}
code {{ background:#0A1122; padding:1px 6px; border-radius:4px; font-size:.85em; }}
strong {{ color:#fff; }}
a {{ color:var(--acc); }}
hr {{ border:none; border-top:1px solid var(--line); margin:28px 0; }}
.badge {{ display:inline-block; padding:2px 10px; border-radius:999px; font-size:.75rem; font-weight:700; }}
.p0 {{ background:#3f1d1d; color:var(--p0); }}
.p1 {{ background:#3f2f10; color:var(--p1); }}
ul {{ padding-left:22px; }}
li {{ margin:6px 0; }}
.meta {{ color:var(--mut); font-size:.85rem; }}
.reports {{ columns:2; column-gap:32px; }}
.reports li {{ break-inside:avoid; }}
</style>
</head>
<body>
<header>
<h1>Auditoria Geral da Plataforma — Birth Hub 360</h1>
<p class="sub">Demanda <strong>DEM-20261115-001</strong> · 15/11/2026 · Orquestrador: Agente 00 · Escopo: somente leitura</p>
<p class="meta">{len(reports)} relatórios de cluster + este consolidado em <code>docs/orchestration/auditoria-20261115/</code>. Achados viram ondas/handoffs — nenhum código foi alterado.</p>
</header>
<main>
<h2>Relatórios por cluster</h2>
<ul class="reports">
{''.join(f'<li><code>{r}</code></li>' for r in reports)}
</ul>
<hr>
{md_to_html(md)}
</main>
</body>
</html>"""

OUT.write_text(page, encoding="utf-8")
print(f"OK -> {OUT} ({OUT.stat().st_size} bytes, {len(reports)} relatórios)")
