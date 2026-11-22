# Identidade V2.1 — o que está no repositório e o que fica só no pacote

`MANIFEST.sha256` descreve o **pacote completo auditado** (148 arquivos). O repositório versiona 77 deles.

- **Fora do git:** 71 capturas de tela de evidência (cerca de 73 MB), listadas em `EVIDENCIAS-FORA-DO-GIT.txt`. Motivo: `public/` tem budget de 60 MB no CI (`scripts/ci/check-public-budget.mjs`) e é servido sem autenticação em produção. Elas existem no pacote `birthub360-identidade-v2-final.zip` entregue ao proprietário.
- **Consequência:** em um checkout limpo, `sha256sum -c MANIFEST.sha256` falha nessas 71 linhas por arquivo ausente. Os 77 arquivos versionados conferem. Para conferir só o que está no git:

```bash
grep -vFf <(sed 's#^#  #' EVIDENCIAS-FORA-DO-GIT.txt) MANIFEST.sha256 | sha256sum -c --quiet
```

- As evidências em texto (JSON e TXT) e o `_baseline-v2.0/v2.0-entregue.tar.gz` estão versionados.
- `scripts-verificacao/` guarda os scripts Playwright usados pelo Agente 00. Eles têm caminhos absolutos do ambiente em que rodaram e sobrescrevem evidências: servem de registro, não de ferramenta portátil.
- Este arquivo, `EVIDENCIAS-FORA-DO-GIT.txt`, `index.html`, `10-aceite/index.html` e `scripts-verificacao/` ficam fora do manifesto.
