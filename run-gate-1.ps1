.\fnm\fnm.exe env --use-on-cd | Out-String | Invoke-Expression
npx tsc --noEmit
npm run lint
npm run test:architecture
npm run test:unit
