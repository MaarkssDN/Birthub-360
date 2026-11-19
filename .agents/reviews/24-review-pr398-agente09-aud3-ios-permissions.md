# Parecer de Revisão Independente — Agente 24

- **Missão:** Revisão do PR #398 (repo MaarkssDN/Birthub-360) — resgate AUD-3 iOS/Android permissions
- **Autor:** trabalho órfão do Agente 09 resgatado na branch `agente/09-aud3-ios-permissions`
- **Auditor:** Agente 24 — Revisão Independente
- **Base:** `main`
- **Arquivos auditados (7 arquivos):**
  - `android/app/src/main/AndroidManifest.xml`
  - `android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java`
  - `index.html`
  - `ios/App/App/Info.plist`
  - `ios/App/App/SceneDelegate.swift`
  - `src/components/ui/BottomSheet.tsx`
  - `tests/unit/navigation/ios-valid-tabs-parity.test.ts` (novo)
- **Método:** leitura do diff completo do PR; conferência de propriedade (android/**, ios/**, capacitor → Agente 09) e de paridade de navegação.

## Verificações realizadas

1. **Escopo/propriedade:** todos os arquivos nativos e de navegação são do domínio do Agente 09 (AGENTS.md §15). `index.html` e `BottomSheet.tsx` são compartilhados, mas a alteração é de viewport/safe-area — coerente com a missão mobile. `tests/unit/navigation/` é arquivo de teste novo, sem conflito de dono.
2. **SceneDelegate.swift:** remove URL de servidor hardcoded/morta e passa a ler `serverURL` da configuração do Capacitor bridge — elimina config divergente entre builds.
3. **Paridade de tabs:** novo teste `ios-valid-tabs-parity.test.ts` valida que `validTabs` do iOS corresponde a `ACTIVE_NAV_TABS` — fecha a classe de bug "aba existe no iOS mas não na web" (e vice-versa).
4. **Permissões:** remoção de permissões Android não utilizadas (localização) — minimização de superfície, bom para store review e segurança.
5. **Safe-area/viewport:** ajustes em `index.html` e `BottomSheet.tsx` para respeitar safe-area do iOS — consistente com o débito de UX mobile.
6. **Info.plist/MainActivity:** alinhamento de permissões e comportamento nativo.

## Achados

1. **[MÉDIA — verificação manual pendente]** Mudanças em `SceneDelegate.swift`, `Info.plist` e `AndroidManifest.xml` não são cobertas por CI unitário — exigem build nativo (Xcode/Android Studio) e smoke test em device/simulador antes do release. O teste de paridade cobre apenas a lista de tabs, não o comportamento nativo.
2. **[BAIXA]** `BottomSheet.tsx` é componente compartilhado web/mobile — confirmar que o ajuste de safe-area não altera layout em desktop/browser (viewport-fit=cover só deve afetar quando aplicável).
3. **[BAIXA]** Remoção de permissões Android pode exigir justificativa se alguma feature (prospecção com geolocalização?) as usava indiretamente — verificar se há uso de `ACCESS_FINE_LOCATION` no código JS.

## Veredicto

**APROVADO** para a revisão exata do commit de resgate, condicionado a:

- CI verde;
- smoke test nativo registrado (build iOS/Android) antes de qualquer release mobile;
- nenhum commit adicional na branch após esta revisão.

Este parecer não aprova merge/deploy — seguem as autorizações de AGENTS.md §40/§21.
