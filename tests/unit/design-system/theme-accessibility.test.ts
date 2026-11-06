import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Design System — Theme & Accessibility without forced !important', () => {
  it('confirma que src/index.css nao possui nenhuma regra forcada com !important', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const content = fs.readFileSync(cssPath, 'utf8');

    const importantMatches = content.match(/!important/g);
    expect(importantMatches).toBeNull();
  });
});
