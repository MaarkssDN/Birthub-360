import { describe, expect, it } from 'vitest';
import {
  extractGeneratedBlock,
  findSchemaDrift,
  listEncryptedFields,
  parsePrismaSchema,
  renderRopaModelsMarkdown,
  ROPA_GENERATED_END,
  ROPA_GENERATED_START,
  upsertGeneratedBlock,
} from '../../../src/lib/privacy/ropaInventory.js';

const SCHEMA = `
model Contact {
  id        String   @id
  email     String?
  phone     String?
  whatsapp  String?
  // comentário não é campo
  @@index([email])
}

enum Role {
  ADMIN
}
`;

describe('ropaInventory — TAREFA-SANEAMENTO-052', () => {
  it('parsePrismaSchema extrai models e campos, ignorando enums/diretivas/comentários', () => {
    const models = parsePrismaSchema(SCHEMA);
    expect([...models.keys()]).toEqual(['Contact']);
    expect([...models.get('Contact')!.fields].sort()).toEqual([
      'email',
      'id',
      'phone',
      'whatsapp',
    ]);
  });

  it('findSchemaDrift: sucesso quando model e campo existem', () => {
    const issues = findSchemaDrift({ Contact: ['email', 'phone'] }, SCHEMA);
    expect(issues).toEqual([]);
  });

  it('findSchemaDrift: falha com MODEL_MISSING quando o model não existe', () => {
    const issues = findSchemaDrift({ VozInexistente: ['audio'] }, SCHEMA);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ kind: 'MODEL_MISSING', model: 'VozInexistente' });
  });

  it('findSchemaDrift: falha com FIELD_MISSING quando o campo não existe no model', () => {
    const issues = findSchemaDrift({ Contact: ['email', 'campoFantasma'] }, SCHEMA);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      kind: 'FIELD_MISSING',
      model: 'Contact',
      field: 'campoFantasma',
    });
  });

  it('listEncryptedFields é determinístico e ordenado', () => {
    const a = listEncryptedFields({ B: ['y', 'x'], A: ['z'] });
    const b = listEncryptedFields({ A: ['z'], B: ['x', 'y'] });
    expect(a).toEqual(b);
    expect(a.map((e) => `${e.model}.${e.field}`)).toEqual(['A.z', 'B.x', 'B.y']);
  });

  it('render/extract/upsert do bloco gerado: round-trip e idempotência', () => {
    const fields = { Contact: ['email'], VoiceCallLog: ['transcript'] };
    const block = renderRopaModelsMarkdown(fields);
    const doc = `# ROPA\n\nTexto.\n\n${block}\n`;
    expect(extractGeneratedBlock(doc)).toBe(block);
    // upsert com bloco idêntico não altera o documento
    expect(upsertGeneratedBlock(doc, block)).toBe(doc);
    // upsert sem marcadores anexa ao final
    const appended = upsertGeneratedBlock('# ROPA\n', block);
    expect(appended).toContain(ROPA_GENERATED_START);
    expect(appended.trimEnd().endsWith(ROPA_GENERATED_END)).toBe(true);
  });

  it('extractGeneratedBlock rejeita marcadores ausentes, duplicados ou fora de ordem', () => {
    expect(extractGeneratedBlock('# sem marcadores')).toBeNull();
    const dup = `${ROPA_GENERATED_START}x${ROPA_GENERATED_END}${ROPA_GENERATED_START}y${ROPA_GENERATED_END}`;
    expect(extractGeneratedBlock(dup)).toBeNull();
    const inverted = `${ROPA_GENERATED_END}x${ROPA_GENERATED_START}`;
    expect(extractGeneratedBlock(inverted)).toBeNull();
    expect(() => upsertGeneratedBlock(dup, 'b')).toThrow(/duplicados/);
  });
});
