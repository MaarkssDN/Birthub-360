const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'visual-manual-output', 'routes-with-screenshots.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'visual-manual-output', 'BirthHub360_Manual_Visual_da_Plataforma.html');

const routesData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BirthHub 360 — Manual Visual da Plataforma</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0b132b;
      color: #f8fafc;
      line-height: 1.6;
    }

    .container {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 280px;
      background: #0f172a;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding: 20px;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar h1 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 30px;
      color: #00e5ff;
    }

    .sidebar h2 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.5);
      margin: 20px 0 10px 0;
    }

    .sidebar a {
      display: block;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 4px;
      transition: all 0.2s;
      font-size: 13px;
    }

    .sidebar a:hover {
      background: rgba(0, 229, 255, 0.1);
      color: #00e5ff;
    }

    .main-content {
      flex: 1;
      margin-left: 280px;
      padding: 40px;
      max-width: 1400px;
    }

    .header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #00e5ff 0%, #3b82f6 55%, #8b5cf6 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .header .meta {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
    }

    .stat-card .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #00e5ff;
    }

    .section {
      margin-bottom: 60px;
    }

    .section h2 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f8fafc;
    }

    .route-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .route-card h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #00e5ff;
    }

    .route-card .route {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 16px;
    }

    .route-card .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-right: 8px;
    }

    .badge.public {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .badge.private {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .screenshot-container {
      margin-top: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .screenshot-container img {
      width: 100%;
      height: auto;
      display: block;
    }

    .design-system-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .color-swatch {
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .color-swatch .name {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .color-swatch .hex {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      opacity: 0.7;
    }

    .component-list {
      list-style: none;
    }

    .component-list li {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 14px;
    }

    .component-list li:last-child {
      border-bottom: none;
    }

    .back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #00e5ff;
      color: #0b132b;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      font-size: 20px;
      display: none;
      z-index: 1000;
    }

    .back-to-top.visible {
      display: block;
    }

    @media (max-width: 1024px) {
      .sidebar {
        display: none;
      }
      .main-content {
        margin-left: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">
      <h1>BirthHub 360</h1>
      
      <h2>Visão Geral</h2>
      <a href="#overview">Estatísticas</a>
      <a href="#design-system">Design System</a>
      
      <h2>Pilar 01 — Hub Comercial</h2>
      <a href="#workspace">Meu Espaço</a>
      <a href="#crm">Pipeline CRM</a>
      <a href="#crm360">Gestão de Negócios</a>
      <a href="#propostas">Propostas</a>
      <a href="#companies">Empresas</a>
      <a href="#contacts">Decisores</a>
      
      <h2>Pilar 02 — Inteligência de Mercado</h2>
      <a href="#prospect">Prospecção</a>
      <a href="#market-intelligence">Pesquisa de Mercado</a>
      
      <h2>Pilar 03 — Orquestração de Vendas</h2>
      <a href="#playbooks">Playbooks Comerciais</a>
      <a href="#cadence">Cadências</a>
      <a href="#jornadas">Jornadas Comerciais</a>
      <a href="#processos">Processos de Vendas</a>
      <a href="#roteiros">Roteiros de Abordagem</a>
      <a href="#daily-plan">Plano Diário</a>
      <a href="#activities">Tarefas & Atividades</a>
      <a href="#calendar">Calendário</a>
      <a href="#qualification_matrix">Matriz de Qualificação</a>
      <a href="#objections_matrix">Matriz de Objeções</a>
      <a href="#roleplay">Roleplay</a>
      <a href="#topic_training">Academy</a>
      <a href="#chatbook">Chatbook</a>
      <a href="#editor">Editor de Documentos</a>
      
      <h2>Pilar 04 — Performance Comercial</h2>
      <a href="#dashboard">Command Center</a>
      <a href="#analytics">Analytics</a>
      <a href="#winloss">Win/Loss</a>
      <a href="#reports">Relatórios Avançados</a>
      
      <h2>Pilar 05 — Previsibilidade Comercial</h2>
      <a href="#forecast">Forecast</a>
      <a href="#metas">Metas e Projeções</a>
      <a href="#pipeline_ponderado">Pipeline Ponderado</a>
      
      <h2>Pilar 06 — Inteligência Artificial</h2>
      <a href="#commercial_intelligence">Inteligência de Vendas</a>
      <a href="#intelligence">Assistente de Vendas</a>
      <a href="#knowledge">Base de Conhecimento</a>
      <a href="#sdr-diagnostic">Diagnóstico SDR</a>
      
      <h2>Pilar 07 — Automação & Conectividade</h2>
      <a href="#automations">Automações</a>
      <a href="#integrations">Integrações</a>
      <a href="#bitrix">Guia Prático Bitrix24</a>
      
      <h2>Pilar 08 — Engajamento Comercial</h2>
      <a href="#voice-hub">Voice Hub</a>
      <a href="#mesa-tratamento">Mesa de Tratamento</a>
      
      <h2>Administração</h2>
      <a href="#notifications">Notificações</a>
      <a href="#usage">Consumo de IA</a>
      <a href="#team">Equipe</a>
      <a href="#module-access">Acesso a Módulos</a>
      <a href="#settings">Ajustes Globais</a>
      
      <h2>Público</h2>
      <a href="#login">Login</a>
      <a href="#welcome">Welcome Screen</a>
      <a href="#privacy">Privacy Policy</a>
      <a href="#terms">Terms of Use</a>
    </aside>

    <main class="main-content">
      <div class="header">
        <h1>BirthHub 360 — Manual Visual da Plataforma</h1>
        <div class="meta">
          <p>Data da Auditoria: ${new Date().toISOString()}</p>
          <p>Versão: 1.0.0</p>
          <p>Framework: React + Vite + Tailwind CSS 4</p>
        </div>
      </div>

      <div class="stats-grid" id="overview">
        <div class="stat-card">
          <div class="label">Total de Rotas</div>
          <div class="value">${routesData.length}</div>
        </div>
        <div class="stat-card">
          <div class="label">Rotas Públicas</div>
          <div class="value">${routesData.filter(r => r.public).length}</div>
        </div>
        <div class="stat-card">
          <div class="label">Rotas Privadas</div>
          <div class="value">${routesData.filter(r => !r.public).length}</div>
        </div>
        <div class="stat-card">
          <div class="label">Screenshots</div>
          <div class="value">${routesData.length}</div>
        </div>
      </div>

      <div class="section" id="design-system">
        <h2>Design System</h2>
        
        <div class="design-system-section">
          <h3>Tipografia</h3>
          <p><strong>Sora</strong> — Display (títulos, hero, chamadas institucionais). Fonte variável (100–800).</p>
          <p><strong>IBM Plex Mono</strong> — UI e dados (menus, textos, tabelas, dashboards, números). Pesos: 400/500/600/700 + 400 itálico.</p>
          <p>Ambas self-hosted em public/fonts/ para funcionar offline no Android via Capacitor.</p>
        </div>

        <div class="design-system-section">
          <h3>Cores Principais</h3>
          <div class="color-grid">
            <div class="color-swatch" style="background: #00e5ff; color: #0b132b;">
              <div class="name">Brand</div>
              <div class="hex">#00e5ff</div>
            </div>
            <div class="color-swatch" style="background: #3b82f6; color: white;">
              <div class="name">Orbit Blue</div>
              <div class="hex">#3b82f6</div>
            </div>
            <div class="color-swatch" style="background: #8b5cf6; color: white;">
              <div class="name">Iris</div>
              <div class="hex">#8b5cf6</div>
            </div>
            <div class="color-swatch" style="background: #ef4444; color: white;">
              <div class="name">Red</div>
              <div class="hex">#ef4444</div>
            </div>
            <div class="color-swatch" style="background: #22c55e; color: white;">
              <div class="name">Green</div>
              <div class="hex">#22c55e</div>
            </div>
            <div class="color-swatch" style="background: #f59e0b; color: #0b132b;">
              <div class="name">Warn</div>
              <div class="hex">#f59e0b</div>
            </div>
          </div>
        </div>

        <div class="design-system-section">
          <h3>Componentes Globais</h3>
          <ul class="component-list">
            <li><strong>Sidebar</strong> — Navegação lateral com 8 pilares estratégicos + Administração. Estados: expandido (220px) / colapsado (64px). Animação de transição 300ms.</li>
            <li><strong>Button</strong> — Variants: default, primary, tertiary, success, destructive, outline, secondary, ghost, link, cosmic. Sizes: sm, default, lg, icon. Loading state com spinner.</li>
            <li><strong>Card</strong> — Elevação com shadow card, hover com shadow card-hover. Border-radius: 12px.</li>
            <li><strong>Input</strong> — Formulários com focus ring (ring-brand ring-offset-2 ring-offset-bg).</li>
            <li><strong>Modal/Drawer</strong> — Componentes de dialog com overlay e blur.</li>
            <li><strong>Badge</strong> — Indicadores de status com cores semânticas (success, warning, error, info).</li>
            <li><strong>Tooltip</strong> — Tooltips posicionais com delay e animação.</li>
            <li><strong>Table</strong> — Tabelas com ordenação, filtros, paginação e ações por linha.</li>
          </ul>
        </div>

        <div class="design-system-section">
          <h3>Animações</h3>
          <p><strong>Durações:</strong> instant (100ms), fast (150ms), normal (250ms), slow (350ms), slowest (500ms).</p>
          <p><strong>Easings:</strong> standard (cubic-bezier(0.4, 0, 0.2, 1)), enter (cubic-bezier(0.22, 1, 0.36, 1)), exit (cubic-bezier(0.4, 0, 1, 1)), emphasized (cubic-bezier(0.16, 1, 0.3, 1)).</p>
          <p><strong>Transições de navegação:</strong> NavLaunchTransition (ícone voa ao centro, gira, revela logo). Respeita prefers-reduced-motion.</p>
        </div>
      </div>

      <div class="section">
        <h2>Telas da Plataforma</h2>
        ${routesData.map(route => `
          <div class="route-card" id="${route.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
            <h3>${route.name}</h3>
            <div class="route">${route.route}</div>
            <div>
              <span class="badge ${route.public ? 'public' : 'private'}">${route.public ? 'Público' : 'Privado'}</span>
            </div>
            <div class="screenshot-container">
              <img src="${route.base64}" alt="${route.name}" loading="lazy" />
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>Pendências</h2>
        <div class="route-card">
          <h3>Limitações da Auditoria</h3>
          <ul>
            <li>1 rota falhou: Welcome Screen (/) — timeout ao carregar</li>
            <li>Todas as rotas privadas redirecionaram para /login devido à falta de autenticação durante a captura</li>
            <li>Os screenshots mostram a tela de login para rotas privadas (comportamento esperado sem sessão ativa)</li>
            <li>Estados de hover, focus, loading e empty states não foram capturados individualmente</li>
            <li>Modais, dropdowns e drawers não foram abertos durante a captura automática</li>
          </ul>
        </div>
      </div>
    </main>
  </div>

  <button class="back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑</button>

  <script>
    window.addEventListener('scroll', () => {
      const backToTop = document.querySelector('.back-to-top');
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_FILE, html);

console.log(`Manual HTML gerado: ${OUTPUT_FILE}`);
console.log(`Tamanho do arquivo: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
