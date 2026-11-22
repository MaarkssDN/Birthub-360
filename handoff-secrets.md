De: 15
Para: 00
Onda: 1
Status: REPORT
Prioridade: P1
Problema: Resultado do Secret Scan - Firebase applet config secret encontrado.
Arquivo: `agente-codigo-local/firebase-applet-config.json` (apiKey hardcoded)
Ação Tomada: Substituido por env var.
Problema: Encontrado secrets hardcoded em `Dockerfile` e placeholders vazando credenciais em arquivos de configuração (`prisma.config.ts`, docker composes e mocks do setup).
Ação Tomada: No `Dockerfile`, removemos as credenciais de teste para DATABASE_URL inicial.
Os encontrados em `prisma.config.ts`, arquivos de mock, e `.env.example` são falsos positivos, documentados na base como testes.
