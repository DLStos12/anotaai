// ------------------------- ESTRUTURA ------------------------------
function shell(title, content, active='inicio') {
  const avisos = notificacoesCount();
  document.body.classList.remove('menu-aberto');
  const app = document.querySelector('#app');
  app.classList.toggle('teo-open', title === 'Conversa com o Téo');
  app.innerHTML = `
    <header class="top">
      <div class="brand-wrap">
        <svg class="app-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0A1D4E"/><stop offset="100%" stop-color="#030E29"/></linearGradient>
            <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3DE049"/><stop offset="100%" stop-color="#1BA227"/></linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/></filter>
          </defs>
          <rect x="24" y="24" width="464" height="464" rx="100" fill="url(#bgGrad)"/>
          <g filter="url(#shadow)">
            <path d="M 120 115 C 115 115 110 120 110 125 L 132 385 C 133 395 142 402 152 402 L 320 380 C 330 379 337 370 335 360 L 315 115 Z" fill="#1852C8"/>
            <path d="M 128 110 C 128 98 138 88 150 88 L 358 88 C 370 88 380 98 380 110 L 380 360 L 362 372 L 344 360 L 326 372 L 308 360 L 290 372 L 272 360 L 254 372 L 236 360 L 218 372 L 200 360 L 182 372 L 164 360 L 146 372 L 128 360 Z" fill="#FFFFFF"/>
          </g>
          <g fill="none" stroke="#0D2B6B" stroke-width="12" stroke-linecap="round"><path d="M 172 70 L 172 120"/><path d="M 222 70 L 222 120"/><path d="M 272 70 L 272 120"/><path d="M 322 70 L 322 120"/></g>
          <g fill="#0D2B6B">
            <path d="M 160 162 H 168 L 178 190 H 210 L 218 162 H 160 Z M 180 200 A 5 5 0 1 1 180 210 A 5 5 0 1 1 180 200 Z M 205 200 A 5 5 0 1 1 205 210 A 5 5 0 1 1 205 200 Z"/>
            <circle cx="185" cy="242" r="11"/>
            <path d="M 168 272 C 168 260 175 257 185 257 C 195 257 202 260 202 272 Z"/>
            <text x="172" y="340" font-family="Arial, sans-serif" font-weight="900" font-size="38" fill="#0D2B6B">$</text>
            <rect x="230" y="162" width="85" height="11" rx="5.5"/><rect x="230" y="184" width="65" height="11" rx="5.5"/><rect x="226" y="240" width="75" height="11" rx="5.5"/><rect x="226" y="262" width="55" height="11" rx="5.5"/><rect x="232" y="312" width="65" height="11" rx="5.5"/><rect x="232" y="334" width="45" height="11" rx="5.5"/>
          </g>
          <g fill="#3DE049"><rect x="382" y="96" width="10" height="28" rx="5" transform="rotate(25 387 110)"/><rect x="402" y="128" width="10" height="28" rx="5" transform="rotate(65 407 142)"/><rect x="402" y="172" width="10" height="24" rx="5" transform="rotate(100 407 184)"/></g>
          <g filter="url(#shadow)"><circle cx="360" cy="285" r="72" fill="url(#greenGrad)"/><path d="M 322 285 L 348 312 L 402 252" fill="none" stroke="#FFFFFF" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/></g>
        </svg>
        <div class="top-text"><h1>AnotaAí</h1><p>${title}</p></div>
      </div>
      <div class="top-actions">
        <button class="bell" onclick="abrirNotificacoes()" title="Notificações">🔔${avisos ? `<span>${avisos}</span>` : ''}</button>
        <label class="theme-toggle" title="Alternar modo claro/escuro"><input type="checkbox" ${document.documentElement.dataset.theme==='dark'?'checked':''} onchange="toggleTheme(this.checked)"><span class="theme-slider"><span>☀️</span><span>🌙</span></span></label>
        <button class="menu-toggle" onclick="abrirMenuPrincipal()" title="Abrir menu" aria-label="Abrir menu" aria-controls="menuPrincipal">☰</button>
      </div>
    </header>

    <main class="page">${content}</main>

    <div id="menuPrincipal" class="menu-overlay" onclick="fecharMenuPrincipal(event)" aria-hidden="true">
      <aside class="menu-drawer" role="dialog" aria-modal="true" aria-label="Menu principal">
        <div class="menu-head"><div><strong>Menu</strong><span>Navegação do AnotaAí</span></div><button onclick="fecharMenuPrincipal()" aria-label="Fechar menu">×</button></div>
        <nav class="menu-links">
          <button class="${active==='inicio'?'active':''}" onclick="home()"><span>⌂</span><div><b>Início</b><small>Visão geral</small></div></button>
          <button class="${active==='vendas'?'active':''}" onclick="vendas()"><span>🛒</span><div><b>Vendas</b><small>Histórico e nova venda</small></div></button>
          <button class="${active==='relatorios'?'active':''}" onclick="relatorios()"><span>▥</span><div><b>Relatórios</b><small>Vendas e pagamentos</small></div></button>
          <button class="${active==='financeiro'?'active':''}" onclick="financeiro()"><span>💰</span><div><b>Financeiro</b><small>Ganhos, vendas e gastos</small></div></button>
          <button class="${active==='mais'?'active':''}" onclick="mais()"><span>•••</span><div><b>Mais</b><small>Clientes, produtos e ajustes</small></div></button>
        </nav>
      </aside>
    </div>

    <button 
    class="fab-ai ${planoPro()?'':'free-locked'}" 
    onclick="planoPro()?abrirAssistenteIA():exigirPro('O Téo')" 
    title="Falar com o Téo" 
    aria-label="Abrir o assistente Téo">
      <img src="teo-avatar.png" alt="">
    </button>
    
    <button 
    class="fab-sale" 
    onclick="novaVenda()" 
    title="Nova venda" 
    aria-label="Nova venda">🛒<span>+</span>
    </button>`;
}

function abrirMenuPrincipal(){const menu=document.getElementById('menuPrincipal');if(!menu)return;menu.classList.add('open');menu.setAttribute('aria-hidden','false');document.body.classList.add('menu-aberto');setTimeout(()=>menu.querySelector('.menu-head button')?.focus(),80);}
function fecharMenuPrincipal(evento){const menu=document.getElementById('menuPrincipal');if(evento&&evento.target!==menu)return;menu?.classList.remove('open');menu?.setAttribute('aria-hidden','true');document.body.classList.remove('menu-aberto');}
document.addEventListener('keydown',evento=>{if(evento.key==='Escape')fecharMenuPrincipal();});

// --------------------------- HOME ---------------------------------
function home() {
  const hoje = new Date().toDateString();
  const vendasHoje = db.vendas.filter(v => new Date(v.data).toDateString() === hoje).reduce((s,v) => s + v.total, 0);
  const cobrancas = clientesParaCobrarHoje();
  const estoque = produtosEstoqueBaixo();
  shell(db.config.usuarioNome ? `Olá, ${escapeHtml(db.config.usuarioNome)}!` : 'Visão geral', `
    <div class="plan-chip ${planoAtual()}">Plano ${nomePlano()}</div>
    ${cobrancas.length ? `<section class="card alert-card"><div><b>💰 ${cobrancas.length} cliente(s) para cobrar hoje</b><p class="muted">Inicie a fila e envie as cobranças uma por uma pelo WhatsApp.</p></div><button class="btn whatsapp-btn" onclick="iniciarFilaCobrancasPendentes()">💬 Iniciar fila</button></section>` : ''}
    <section class="card"><div class="toolbar"><h2>Resumo geral</h2><span class="muted">${new Date().toLocaleDateString('pt-BR')}</span></div><div class="summary"><div>Total em aberto<strong>${money(totalAberto())}</strong></div><div>Vendas hoje<strong>${money(vendasHoje)}</strong></div><div>Clientes<strong>${db.clientes.length}</strong></div></div></section>
    <section class="grid"><button class="action green" onclick="novaVenda()"><b>🛒 Nova Venda</b><span>Registrar compra de um cliente</span></button><button class="action blue" onclick="clientes()"><b>👥 Clientes</b><span>Clientes, cobranças e pagamentos</span></button><button class="action orange" onclick="produtos()"><b>📦 Produtos</b><span>Produtos, estoque e reposição</span></button><button class="action yellow" onclick="relatorios()"><b>📊 Relatórios</b><span>Consultar vendas por período</span></button></section>
    ${estoque.length ? `<section class="card"><h3>⚠️ Estoque baixo</h3><div class="list">${estoque.map(p=>`<div class="item"><b>${escapeHtml(p.nome)}</b><span>${p.estoque} un.</span></div>`).join('')}</div></section>`:''}
    <section class="card"><h3>Vendas recentes</h3><div class="list">${db.vendas.slice(-5).reverse().map(v=>`<div class="item"><div><b>${escapeHtml(cliente(v.clienteId).nome)}</b><div class="muted">${dt(v.data)}</div></div><span class="price">${money(v.total)}</span></div>`).join('')||'<div class="empty">Nenhuma venda registrada.</div>'}</div></section>
    <footer class="home-footer">Criado e desenvolvido por Derick Luiz</footer>`, 'inicio');
  // Popup somente uma vez por dia ao abrir, se houver cobranças.
  const key = 'cvPopupCobranca';
  const assinatura = cobrancas.map(c => c.id + ':' + c.dataHoraCobranca).sort().join('|');
  if (cobrancas.length && localStorage.getItem(key) !== assinatura) { localStorage.setItem(key, assinatura); setTimeout(abrirNotificacoes, 150); }
  if (!cobrancas.length) localStorage.removeItem(key);
  verificarAvisoVencimentoPremium();
}

function abrirNotificacoes() {
  const cs = clientesParaCobrarHoje(), es = produtosEstoqueBaixo();
  const modal = document.createElement('div'); modal.className='modal-backdrop'; modal.id='modalAvisos';
  modal.innerHTML = `<div class="modal-box"><div class="toolbar"><div><h3>🔔 Notificações</h3><p class="muted">Pendências de hoje</p></div><button class="modal-close" onclick="fecharModal('modalAvisos')">×</button></div>
    <h4>💰 Cobranças</h4>${cs.length?`<button class="btn whatsapp-btn queue-start-btn" onclick="fecharModal('modalAvisos');iniciarFilaCobranca(${JSON.stringify(cs.map(c=>c.id))})">💬 Iniciar fila de ${cs.length} cobrança(s)</button>`:''}<div class="list">${cs.map(c=>`<div class="item"><div><b>${escapeHtml(c.nome)}</b><div class="muted">Em aberto: ${money(saldoCliente(c.id))}</div><div class="muted">Agendada: ${formatarCobranca(c)}</div></div><button class="btn whatsapp-btn" onclick="fecharModal('modalAvisos');enviarMensagem(${c.id})">Cobrar</button></div>`).join('')||'<div class="empty">Nenhuma cobrança para hoje.</div>'}</div>
    <h4>📦 Estoque baixo</h4><div class="list">${es.map(p=>`<div class="item"><b>${escapeHtml(p.nome)}</b><span>${p.estoque} un.</span></div>`).join('')||'<div class="empty">Nenhum alerta de estoque.</div>'}</div></div>`;
  document.body.appendChild(modal);
}
function fecharModal(id) { document.getElementById(id)?.remove(); }
