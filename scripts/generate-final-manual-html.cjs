const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, '..', 'audit-screenshots');

const routeMeta = [
  { path: '/app', name: 'Dashboard / Command Center', group: 'Visão Geral & Cockpit', file: 'route-_app.png' },
  { path: '/app/crm', name: 'Gestão de Pipeline / CRM Board', group: 'Hub Comercial', file: 'route-_app_crm.png' },
  { path: '/app/commercial_intelligence', name: 'Comercial Inteligente', group: 'Inteligência Comercial', file: 'route-_app_commercial_intelligence.png' },
  { path: '/app/integrations', name: 'Central de Integrações & Bitrix24', group: 'Conectividade & Automação', file: 'route-_app_integrations.png' },
  { path: '/app/intelligence', name: 'Hub de Inteligência & RAG', group: 'Inteligência de Mercado', file: 'route-_app_intelligence.png' },
  { path: '/app/team', name: 'Gestão de Equipe & Permissões', group: 'Governança & Pessoas', file: 'route-_app_team.png' },
  { path: '/app/settings', name: 'Configurações Globais da Plataforma', group: 'Administração & Sistema', file: 'route-_app_settings.png' },
  { path: '/app/cadence', name: 'Cadências Multicanal de Vendas', group: 'Orquestração de Vendas', file: 'route-_app_cadence.png' },
  { path: '/app/reports', name: 'Relatórios Executivos & Exportação', group: 'Performance & Analytics', file: 'route-_app_reports.png' },
  { path: '/app/automations', name: 'Automações & Regras de Workflow', group: 'Conectividade & Automação', file: 'route-_app_automations.png' },
  { path: '/app/daily-plan', name: 'Plano Diário & Fechamento', group: 'Orquestração de Vendas', file: 'route-_app_daily-plan.png' },
  { path: '/app/analytics', name: 'Analytics, Métricas & Funil', group: 'Performance & Analytics', file: 'route-_app_analytics.png' }
];

let cardsHtml = '';

for (const item of routeMeta) {
  const filePath = path.join(screenshotsDir, item.file);
  let imgBase64 = '';
  if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    imgBase64 = `data:image/png;base64,${buf.toString('base64')}`;
  }

  cardsHtml += `
    <article className="card" style="background:#0D193A; border:1px solid rgba(255,255,255,0.12); border-radius:1.5rem; padding:1.5rem; margin-bottom:2rem; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; tracking:0.1em; color:#D4AF37; font-family:monospace;">${item.group}</span>
          <h2 style="font-size:1.25rem; font-weight:700; color:#FFFFFF; margin:0.25rem 0 0 0;">${item.name}</h2>
          <code style="font-size:0.8rem; color:#94A3B8;">${item.path}</code>
        </div>
        <span style="background:rgba(15,157,100,0.2); border:1px solid rgba(15,157,100,0.4); color:#34D399; font-size:0.75rem; font-weight:700; padding:0.35rem 0.75rem; border-radius:9999px;">Autenticado & Renderizado</span>
      </div>
      <div style="border-radius:1rem; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background:#0B132B;">
        ${imgBase64 ? `<img src="${imgBase64}" alt="${item.name}" style="width:100%; height:auto; display:block;" />` : '<div style="padding:3rem; text-align:center; color:#94A3B8;">Imagem não disponível</div>'}
      </div>
    </article>
  `;
}

const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR" style="background:#080E21; color:#F8FAFC; font-family: 'Inter', system-ui, sans-serif;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Birth Hub 360º — Manual Visual & Auditoria Completa da Plataforma</title>
  <style>
    body { margin:0; padding:2rem; background:#080E21; color:#F8FAFC; }
    header { max-width:1200px; margin:0 auto 3rem auto; padding-bottom:2rem; border-bottom:1px solid rgba(255,255,255,0.1); }
    h1 { font-size:2.25rem; font-weight:800; color:#FFFFFF; margin:0 0 0.5rem 0; }
    p.subtitle { color:#94A3B8; font-size:1rem; margin:0; }
    main { max-width:1200px; margin:0 auto; }
  </style>
</head>
<body>
  <header>
    <h1>Birth Hub 360º — Manual Visual da Plataforma</h1>
    <p class="subtitle">Auditoria de UX/UI completa das telas autenticadas com a nova Sidebar interativa estilo Command Center.</p>
  </header>
  <main>
    ${cardsHtml}
  </main>
</body>
</html>`;

const targetFile = 'C:\\Github\\BirthHub360_Manual_Visual_da_Plataforma.html';
fs.writeFileSync(targetFile, fullHtml, 'utf8');
console.log('Manual HTML gerado com sucesso em:', targetFile);
