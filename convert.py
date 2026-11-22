import re

with open('raw_login.html', 'r', encoding='utf-8') as f:
    html = f.read()

style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
styles = style_match.group(1) if style_match else ''

body_match = re.search(r'<body[^>]*>(.*?)<script>', html, re.DOTALL)
body_content = body_match.group(1) if body_match else ''

jsx = body_content.replace('class=', 'className=')
jsx = jsx.replace('for=', 'htmlFor=')

def style_replacer(match):
    style_str = match.group(1)
    rules = style_str.split(';')
    jsx_style = []
    for rule in rules:
        if ':' not in rule: continue
        k, v = rule.split(':', 1)
        k = k.strip()
        v = v.strip().replace(\"'\", \"\\\\'\")
        parts = k.split('-')
        k_camel = parts[0] + ''.join(p.capitalize() for p in parts[1:])
        jsx_style.append(f\"{k_camel}: '{v}'\")
    return 'style={{ ' + ', '.join(jsx_style) + ' }}'

jsx = re.sub(r'style=\"(.*?)\"', style_replacer, jsx)

svg_props = ['stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule', 'stroke-dasharray', 'stroke-dashoffset', 'stop-color']
for p in svg_props:
    parts = p.split('-')
    camel = parts[0] + ''.join(x.capitalize() for x in parts[1:])
    jsx = jsx.replace(f'{p}=', f'{camel}=')

# self close tags
jsx = re.sub(r'<input([^>]*?)>', r'<input\1 />', jsx)
jsx = re.sub(r'<img([^>]*?)>', r'<img\1 />', jsx)
jsx = re.sub(r'<br([^>]*?)>', r'<br\1 />', jsx)
jsx = re.sub(r'<hr([^>]*?)>', r'<hr\1 />', jsx)

# Remove HTML comments
jsx = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', jsx, flags=re.DOTALL)

with open('src/features/auth/components/NewLoginScreen.tsx', 'w', encoding='utf-8') as f:
    f.write('import React, { useEffect } from \"react\";\n')
    f.write('import \"./NewLoginScreen.css\";\n\n')
    f.write('export function NewLoginScreen() {\n')
    f.write('  useEffect(() => {\n')
    f.write('    // Add any necessary script logic here\n')
    f.write('  }, []);\n')
    f.write('  return (\n')
    f.write('    <>\n')
    f.write(jsx)
    f.write('    </>\n')
    f.write('  );\n')
    f.write('}\n')

with open('src/features/auth/components/NewLoginScreen.css', 'w', encoding='utf-8') as f:
    f.write(styles)

print('Conversion done')
