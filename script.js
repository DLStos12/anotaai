/* ================================================================
   Versão Aplha 1.3
   AnotaAí - Front-end local
   ----------------------------------------------------------------
   Este protótipo usa localStorage. Não há backend nem backup nesta
   versão. O código está dividido em blocos para facilitar o estudo.
   ================================================================ */

// -------------------------- TEMA ---------------------------------
const savedTheme = localStorage.getItem('cvtheme') || 'light';
document.documentElement.dataset.theme = savedTheme;
function toggleTheme(dark) {
  const theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('cvtheme', theme);
}

// ----------------------- BANCO LOCAL ------------------------------
// Sempre iniciamos com listas vazias. Nada de clientes de exemplo.
const emptyDB = () => ({
  clientes: [], produtos: [], vendas: [], pagamentos: [],
  movimentacoesEstoque: [], cobrancas: [],
  config: { usuarioNome: '', pixChave: '', pixNome: '', incluirPix: true, personalizarCobranca: false, mensagemCobranca: '', atualizadoEm: '' }
});
let db;
try { db = JSON.parse(localStorage.getItem('cvdb')) || emptyDB(); }
catch { db = emptyDB(); }
// Compatibilidade com versões antigas do projeto.
db.clientes ||= []; db.produtos ||= []; db.vendas ||= []; db.pagamentos ||= [];
db.movimentacoesEstoque ||= []; db.cobrancas ||= [];
db.exclusoes ||= [];
db.config ||= { usuarioNome:'', pixChave:'', pixNome:'', incluirPix:true, personalizarCobranca:false, mensagemCobranca:'', atualizadoEm:'' };
// Garante os novos campos sem apagar configurações salvas em versões anteriores.
db.config.usuarioNome ??= '';
db.config.pixChave ??= '';
db.config.pixNome ??= '';
db.config.incluirPix ??= true;
db.config.personalizarCobranca ??= false;
db.config.mensagemCobranca ??= '';
db.config.atualizadoEm ??= '';
function save() {
  localStorage.setItem('cvdb', JSON.stringify(db));
  agendarBackupOnline();
}

// ------------------------- UTILIDADES -----------------------------
const money = value => Number(value || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const dt = value => new Date(value).toLocaleString('pt-BR');
const cliente = id => db.clientes.find(c => c.id == id) || {nome:'Cliente removido'};
const produto = id => db.produtos.find(p => p.id == id) || {nome:'Produto removido', preco:0};
const hojeISO = () => new Date().toISOString().slice(0,10);
function escapeHtml(text='') { return String(text).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function totalVendasCliente(id) { return db.vendas.filter(v => v.clienteId == id).reduce((s,v) => s + v.total, 0); }
function totalPagamentosCliente(id) { return db.pagamentos.filter(p => p.clienteId == id).reduce((s,p) => s + p.valor, 0); }
function saldoCliente(id) { return Math.max(0, totalVendasCliente(id) - totalPagamentosCliente(id)); }
function totalAberto() { return db.clientes.reduce((s,c) => s + saldoCliente(c.id), 0); }

// ----------------------- COBRANÇAS / AVISOS -----------------------
// Retorna clientes cuja DATA E HORA de cobrança já chegaram.
// Também verifica se essa cobrança já foi marcada como enviada depois do horário agendado.
function clientesParaCobrarHoje() {
  const agora = new Date();
  return db.clientes.filter(c => {
    if (!c.cobrancaAtiva || !c.dataHoraCobranca || saldoCliente(c.id) <= 0) return false;
    const agendada = new Date(c.dataHoraCobranca);
    if (Number.isNaN(agendada.getTime()) || agendada > agora) return false;
    const ultima = db.cobrancas.filter(x => x.clienteId == c.id).sort((a,b)=>new Date(b.data)-new Date(a.data))[0];
    return !ultima || new Date(ultima.data) < agendada;
  });
}

// Formata o agendamento para aparecer de forma amigável na interface.
function formatarCobranca(c) {
  if (!c.dataHoraCobranca) return 'Sem cobrança agendada';
  return new Date(c.dataHoraCobranca).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

function produtosEstoqueBaixo() {
  return db.produtos.filter(p => p.controlarEstoque && Number(p.estoque) <= Number(p.estoqueMinimo || 0));
}
function notificacoesCount() { return clientesParaCobrarHoje().length + produtosEstoqueBaixo().length; }

// ------------------------- ESTRUTURA ------------------------------
function shell(title, content, active='inicio') {
  const avisos = notificacoesCount();
  document.querySelector('#app').innerHTML = `
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
      </div>
    </header>
    <main class="page">${content}</main>
    <nav class="nav"><button class="${active==='inicio'?'active':''}" onclick="home()">⌂<br>Início</button><button class="${active==='vendas'?'active':''}" onclick="vendas()">🛒<br>Vendas</button><button class="${active==='relatorios'?'active':''}" onclick="relatorios()">▥<br>Relatórios</button><button class="${active==='mais'?'active':''}" onclick="mais()">•••<br>Mais</button></nav><button class="fab-sale" onclick="novaVenda()" title="Nova venda" aria-label="Nova venda">🛒<span>+</span></button>`;
}

// --------------------------- HOME ---------------------------------
function home() {
  const hoje = new Date().toDateString();
  const vendasHoje = db.vendas.filter(v => new Date(v.data).toDateString() === hoje).reduce((s,v) => s + v.total, 0);
  const cobrancas = clientesParaCobrarHoje();
  const estoque = produtosEstoqueBaixo();
  shell(db.config.usuarioNome ? `Olá, ${escapeHtml(db.config.usuarioNome)}!` : 'Visão geral', `
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

// -------------------------- CLIENTES -------------------------------
// Define as tags exibidas abaixo do cliente.
// Regra combinada para deixar a lista simples:
// 1) Antes do vencimento não mostramos tag de atraso.
// 2) Depois do vencimento, quem ainda tem saldo recebe "Em aberto".
// 3) A segunda tag informa se a mensagem dessa cobrança já foi marcada como enviada.
// 4) Quando o saldo chega a zero, mostramos somente a data do pagamento.
function statusCliente(c) {
  const saldo = saldoCliente(c.id);
  const teveCompras = totalVendasCliente(c.id) > 0;

  // Pagamentos mais recentes primeiro. Usamos o último para informar a data da quitação.
  const pagamentos = db.pagamentos
    .filter(p => p.clienteId == c.id)
    .sort((a,b) => new Date(b.data) - new Date(a.data));

  // Se já houve compras e não existe mais saldo, a única tag é "Pago em DD/MM/AAAA".
  if (saldo === 0 && teveCompras) {
    const ultimoPagamento = pagamentos[0];
    const dataPago = ultimoPagamento
      ? new Date(ultimoPagamento.data).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');
    return `<span class="status paid">✓ Pago em ${dataPago}</span>`;
  }

  if (!teveCompras) return '<span class="muted">Sem movimentações</span>';

  // As tags de cobrança só aparecem quando a data E a hora programadas já chegaram.
  if (!c.cobrancaAtiva || !c.dataHoraCobranca) return '';
  const vencimento = new Date(c.dataHoraCobranca);
  if (Number.isNaN(vencimento.getTime()) || vencimento > new Date()) return '';

  // Uma mensagem conta como enviada para ESTE vencimento somente se o registro
  // da cobrança tiver sido criado depois da data/hora agendada. Isso evita que
  // uma cobrança antiga seja confundida com a cobrança atual.
  const mensagemEnviada = db.cobrancas.some(x =>
    x.clienteId == c.id && new Date(x.data) >= vencimento
  );

  return `
    <span class="status open">Em aberto</span>
    <span class="status ${mensagemEnviada ? 'sent' : 'not-sent'}">
      ${mensagemEnviada ? '✓ Mensagem enviada' : 'Mensagem não enviada'}
    </span>`;
}
function clientes() {
  shell('Clientes', `<div class="toolbar"><h2>Clientes</h2><button class="btn" onclick="formCliente()">+ Novo cliente</button></div>
    <section class="card client-search-card"><div class="field client-search-field"><label>Buscar cliente</label><input id="buscaClientes" type="search" placeholder="Digite o nome do cliente..." oninput="filtrarListaClientes()"></div><label class="checkline"><input id="selecionarDevedores" type="checkbox" onchange="selecionarTodosDevedores(this.checked)"> Selecionar todos com saldo em aberto</label></section>
    <div id="bulkBar" class="bulk-bar hidden"><b><span id="bulkCount">0</span> selecionado(s)</b><div><button class="btn whatsapp-btn" onclick="cobrarSelecionados()">💬 Cobrar</button> <button class="btn danger" onclick="excluirSelecionados()">🗑 Excluir</button></div></div>
    <div id="listaClientesCadastro" class="list">${htmlListaClientes(db.clientes)}</div>`, 'mais');
}
function htmlListaClientes(lista) {
  return lista.map(c=>`<div class="client-card"><div class="client-head"><label class="client-select"><input class="cliente-check" type="checkbox" value="${c.id}" onchange="atualizarBulk()"></label><div class="client-info"><b>${escapeHtml(c.nome)}</b><div class="client-observation">${c.observacao?`📝 ${escapeHtml(c.observacao)}`:'<span class="muted">Sem observação</span>'}</div><div class="muted">${escapeHtml(c.telefone||'Sem telefone')} ${c.cobrancaAtiva?`· cobrança ${formatarCobranca(c)}`:''}</div><div>${statusCliente(c)}</div></div><button class="btn secondary" onclick="formCliente(${c.id})">Editar</button></div><div class="client-actions"><button class="btn payment-btn" onclick="registrarPagamento(${c.id})">💰 Pagamento</button><button class="btn whatsapp-btn" onclick="enviarMensagem(${c.id})">💬 Enviar mensagem</button><button class="btn danger" onclick="excluirCliente(${c.id})">🗑 Excluir</button></div></div>`).join('') || '<div class="empty">Nenhum cliente encontrado.</div>';
}
function filtrarListaClientes() { const termo=document.querySelector('#buscaClientes').value.trim().toLowerCase(); document.querySelector('#listaClientesCadastro').innerHTML=htmlListaClientes(db.clientes.filter(c=>c.nome.toLowerCase().includes(termo))); atualizarBulk(); }
function selecionados() { return [...document.querySelectorAll('.cliente-check:checked')].map(x=>Number(x.value)); }
function atualizarBulk() { const n=selecionados().length, bar=document.querySelector('#bulkBar'); if(!bar)return; bar.classList.toggle('hidden',!n); document.querySelector('#bulkCount').textContent=n; }
function selecionarTodosDevedores(on) { document.querySelectorAll('.cliente-check').forEach(ch=>ch.checked=on && saldoCliente(Number(ch.value))>0); atualizarBulk(); }
function cobrarSelecionados() { const ids=selecionados().filter(id=>saldoCliente(id)>0); if(!ids.length)return alert('Selecione clientes com saldo em aberto.'); iniciarFilaCobranca(ids); }
function registrarExclusao(tipo,id){db.exclusoes||=[];db.exclusoes=db.exclusoes.filter(x=>!(x.tipo===tipo&&String(x.id)===String(id)));db.exclusoes.push({tipo,id,excluidoEm:new Date().toISOString()});}
function excluirSelecionados() { const ids=selecionados(); if(!ids.length)return; if(!confirm(`Excluir ${ids.length} cliente(s)? O histórico financeiro será preservado.`))return; ids.forEach(id=>registrarExclusao('clientes',id)); db.clientes=db.clientes.filter(c=>!ids.includes(c.id)); save(); clientes(); }
function excluirCliente(id) { const c=db.clientes.find(x=>x.id==id); if(!c)return; if(!confirm(`Tem certeza que deseja excluir o cliente ${c.nome}?\n\nO histórico financeiro será preservado.`))return; registrarExclusao('clientes',id); db.clientes=db.clientes.filter(x=>x.id!=id); save(); clientes(); }

function formCliente(id, nomeInicial = '') {
  const c = db.clientes.find(x => x.id == id) || {
    nome: nomeInicial,
    telefone: '',
    observacao: ''
  };

  shell(
    id ? 'Editar cliente' : 'Cadastrar cliente',
    `<section class="card">
      <div class="field">
        <label>Nome *</label>
        <input id="cnome" value="${escapeHtml(c.nome)}">
      </div>

      <div class="field">
        <label>Telefone / WhatsApp</label>
        <input id="ctel" value="${escapeHtml(c.telefone || '')}" placeholder="55999999999" inputmode="numeric">
      </div>

      <div class="field">
        <label>Observação</label>
        <textarea id="cobs">${escapeHtml(c.observacao || '')}</textarea>
      </div>

      <label class="checkline">
        <input id="ccobranca" type="checkbox" ${c.cobrancaAtiva ? 'checked' : ''}>
        Ativar lembrete de cobrança
      </label>

      <div class="field">
        <label>Data e hora da cobrança</label>
        <input id="cdatahora" type="datetime-local" value="${c.dataHoraCobranca || ''}">
      </div>

      <button class="btn" onclick="salvarCliente(${id || 'null'})">
        Salvar cliente
      </button>
    </section>`,
    'mais'
  );
}

function salvarCliente(id) {
    const nome = cnome.value.trim();
    const dataHora = cdatahora.value;
    const atualizadoEm = new Date().toISOString();

    if (!nome) {
        return alert('Informe o nome.');
    }

    if (ccobranca.checked && !dataHora) {
        return alert('Informe a data e a hora da cobrança.');
    }

    // Verifica se já existe outro cliente com o mesmo nome
    const nomeNormalizado = nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const clienteDuplicado = db.clientes.find(c => {

        // Se estiver editando, permite manter o próprio nome
        if (id && c.id == id) {
            return false;
        }

        const nomeExistente = c.nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

        return nomeExistente === nomeNormalizado;
    });

    if (clienteDuplicado) {
        return alert(
            `Já existe um cliente cadastrado com o nome "${clienteDuplicado.nome}".`
        );
    }

    const dados = {
        nome,
        telefone: ctel.value.trim(),
        observacao: cobs.value.trim(),
        cobrancaAtiva: ccobranca.checked,
        dataHoraCobranca: ccobranca.checked ? dataHora : null,
        atualizadoEm
    };

    if (id) {
        Object.assign(
            db.clientes.find(c => c.id == id),
            dados
        );
    } else {
        db.clientes.push({
            id: Date.now(),
            ...dados
        });
    }

    save();
    clientes();
}

// ------------------------- PAGAMENTOS ------------------------------
function registrarPagamento(id) { const c=cliente(id); shell('Registrar pagamento', `<section class="card"><h2>${escapeHtml(c.nome)}</h2><p class="muted">Saldo atual</p><h2 class="balance-highlight">${money(saldoCliente(id))}</h2><div class="field"><label>Valor pago *</label><input id="pagvalor" type="number" min="0.01" step="0.01" placeholder="0,00"></div><div class="field"><label>Observação</label><textarea id="pagobs" placeholder="Ex.: Pix, pagamento parcial..."></textarea></div><button class="btn" onclick="salvarPagamento(${id})">Confirmar pagamento</button></section>`, 'mais'); }
function salvarPagamento(id) { const valor=Number(pagvalor.value),agora=new Date().toISOString(); if(!valor||valor<=0)return alert('Informe um valor válido.'); if(valor>saldoCliente(id)&&!confirm('O valor é maior que o saldo atual. Registrar mesmo assim?'))return; db.pagamentos.push({id:Date.now(),clienteId:id,valor,data:agora,observacao:pagobs.value.trim(),atualizadoEm:agora}); save(); alert('Pagamento registrado!'); clientes(); }

// ------------------- WHATSAPP / FILA DE COBRANÇA ------------------
function montarMensagem(id) {
  const c=cliente(id), compras=db.vendas.filter(v=>v.clienteId==id).sort((a,b)=>new Date(a.data)-new Date(b.data));
  const detalhes=compras.length?compras.map(v=>{const d=new Date(v.data); const itens=v.itens.map(i=>`${i.quantidade}x ${i.nome} (${money(i.subtotal)})`).join(', '); return `• ${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} - ${itens} = ${money(v.total)}`;}).join('\n'):'Nenhuma compra registrada.';

  if (db.config.personalizarCobranca && String(db.config.mensagemCobranca || '').trim()) {
    return String(db.config.mensagemCobranca)
      .replaceAll('{pixChave}', db.config.pixChave || '')
      .replaceAll('{pixNome}', db.config.pixNome || '')
      .replaceAll('{usuarioNome}', db.config.usuarioNome || '');
  }

  let msg=`Olá, ${c.nome}! Tudo bem? Segue o detalhamento das suas compras:\n\n${detalhes}\n\n💰 Total em aberto: ${money(saldoCliente(id))}.`;
  if(db.config.incluirPix !== false && db.config.pixChave) msg+=`\n\nPagamento via PIX:\nChave: ${db.config.pixChave}${db.config.pixNome?`\nRecebedor: ${db.config.pixNome}`:''}`;
  return msg;
}
// Monta e abre o link do WhatsApp. Retorna false quando não for possível abrir.
function abrirWhatsApp(id) {
  const c = cliente(id);
  if (!c.telefone) {
    alert('Cadastre o telefone do cliente antes de enviar.');
    return false;
  }

  let numero = String(c.telefone).replace(/\D/g, '');
  if (numero.length <= 11) numero = '55' + numero;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(montarMensagem(id))}`, '_blank');
  return true;
}

// Registra que a mensagem da cobrança atual foi enviada.
// O registro fica associado ao vencimento atual: quando o cliente receber uma
// nova data/hora de cobrança, o sistema voltará a mostrar "Mensagem não enviada".
function registrarMensagemEnviada(id) {
  const c = cliente(id);
  const vencimento = c.dataHoraCobranca ? new Date(c.dataHoraCobranca) : null;

  // Evita criar vários registros se o botão for tocado mais de uma vez para
  // exatamente a mesma cobrança.
  const jaRegistrada = vencimento && !Number.isNaN(vencimento.getTime()) && db.cobrancas.some(x =>
    x.clienteId == id && new Date(x.data) >= vencimento
  );

  if (!jaRegistrada) {
    db.cobrancas.push({
      id: Date.now(),
      clienteId: id,
      data: new Date().toISOString(),
      valor: saldoCliente(id),
      vencimento: c.dataHoraCobranca || null,
      atualizadoEm: new Date().toISOString()
    });
    save();
  }
}

// Ao tocar em "Enviar mensagem", primeiro validamos o telefone e preparamos o
// WhatsApp. O status é salvo imediatamente no localStorage, sem depender de um
// confirm() depois que o navegador troca para o WhatsApp.
function enviarMensagem(id) {
  if (saldoCliente(id) <= 0) return alert('Este cliente não possui valor em aberto.');

  const c = cliente(id);
  if (!c.telefone) return alert('Cadastre o telefone do cliente antes de enviar.');

  registrarMensagemEnviada(id);
  abrirWhatsApp(id);

  // Se a aba do AnotaAí continuar aberta, a tag já é atualizada na hora.
  // Quando o usuário voltar do WhatsApp, o estado também estará salvo.
  if (document.querySelector('#listaClientesCadastro')) clientes();
}
let filaCobranca=[], filaIndex=0;
function iniciarFilaCobrancasPendentes() {
  const ids = clientesParaCobrarHoje().map(c => c.id);
  if (!ids.length) return alert('Nenhuma cobrança pendente para iniciar.');
  iniciarFilaCobranca(ids);
}
function iniciarFilaCobranca(ids) {
  filaCobranca = [...new Set((ids || []).map(Number))].filter(id => cliente(id) && saldoCliente(id) > 0);
  filaIndex = 0;
  if (!filaCobranca.length) return alert('Nenhum cliente com saldo em aberto foi encontrado.');
  fecharModal('modalFila');
  mostrarFila();
}
function mostrarFila() {
  fecharModal('modalFila');
  const id = filaCobranca[filaIndex];
  if (!id) {
    alert('Fila de cobranças concluída.');
    if (document.querySelector('#listaClientesCadastro')) clientes(); else home();
    return;
  }
  const c = cliente(id);
  if (!c || saldoCliente(id) <= 0) { filaIndex++; return mostrarFila(); }
  const temTelefone = !!String(c.telefone || '').replace(/\D/g, '');
  const modal=document.createElement('div');
  modal.id='modalFila'; modal.className='modal-backdrop';
  modal.innerHTML=`<div class="modal-box queue-modal"><div class="toolbar"><div><h3>💬 Fila de cobranças</h3><p class="muted">Cobrança ${filaIndex+1} de ${filaCobranca.length}</p></div><button class="modal-close" onclick="fecharModal('modalFila')">×</button></div><div class="queue-progress"><span style="width:${Math.round(((filaIndex+1)/filaCobranca.length)*100)}%"></span></div><div class="queue-client"><h2>${escapeHtml(c.nome)}</h2><p>Valor em aberto: <b>${money(saldoCliente(id))}</b></p>${temTelefone?`<p class="muted">WhatsApp: ${escapeHtml(c.telefone)}</p>`:'<p class="queue-warning">⚠️ Este cliente não possui telefone cadastrado.</p>'}</div><div class="queue-actions">${temTelefone?`<button class="btn whatsapp-btn" onclick="abrirWhatsApp(${id})">💬 Abrir WhatsApp</button><button class="btn" onclick="confirmarFila(${id})">✅ Marcar enviada e próxima</button><button class="btn secondary" onclick="proximaFila()">Próxima sem marcar</button>`:`<button class="btn secondary" onclick="proximaFila()">Pular cliente</button>`}</div></div>`;
  document.body.appendChild(modal);
}
function confirmarFila(id) {
  registrarMensagemEnviada(id);
  filaIndex++;
  mostrarFila();
}
function proximaFila() { filaIndex++; mostrarFila(); }

// --------------------------- PRODUTOS ------------------------------
function produtos() {
    shell('Produtos', `
        <div class="toolbar">
            <h2>Produtos</h2>
            <button class="btn" onclick="formProduto()">+ Novo produto</button>
        </div>

        <div class="list">
            ${db.produtos.map(p => `
                <div class="item product-card">
                    <div>
                        <b>${escapeHtml(p.nome)}</b>

                        <div class="price">
                            A prazo: ${money(p.precoPrazo ?? p.preco)}
                        </div>

                        <div class="price">
                            À vista: ${money(p.precoAvista ?? p.precoPrazo ?? p.preco)}
                        </div>

                        ${p.controlarEstoque
                            ? `<div class="muted">Estoque: ${p.estoque} · mínimo: ${p.estoqueMinimo}</div>`
                            : '<div class="muted">Estoque não controlado</div>'
                        }
                    </div>

                    <div class="product-actions">
                        ${p.controlarEstoque
                            ? `<button class="btn secondary" onclick="reporEstoque(${p.id})">+ Estoque</button>`
                            : ''
                        }

                        <button class="btn secondary" onclick="formProduto(${p.id})">
                            Editar
                        </button>

                        <button class="btn danger" onclick="excluirProduto(${p.id})">
                            🗑 Excluir
                        </button>
                    </div>
                </div>
            `).join('') || '<div class="empty">Nenhum produto cadastrado.</div>'}
        </div>
    `, 'mais');
}

function formProduto(id) {
    const p = db.produtos.find(x => x.id == id) || {
        nome: '',
        precoPrazo: '',
        precoAvista: '',
        controlarEstoque: false,
        estoque: 0,
        estoqueMinimo: 0
    };

    const precoPrazo = p.precoPrazo ?? p.preco ?? '';
    const precoAvista = p.precoAvista ?? p.precoPrazo ?? p.preco ?? '';

    shell(id ? 'Editar produto' : 'Cadastrar produto', `
        <section class="card">

            <div class="field">
                <label>Produto *</label>
                <input id="pnome" value="${escapeHtml(p.nome)}">
            </div>

            <div class="field">
                <label>Preço a prazo *</label>
                <input
                    id="pprecoPrazo"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${precoPrazo}"
                >
            </div>

            <div class="field">
                <label>Preço à vista *</label>
                <input
                    id="pprecoAvista"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${precoAvista}"
                >
            </div>

            <label class="checkline">
                <input
                    id="pcontrola"
                    type="checkbox"
                    ${p.controlarEstoque ? 'checked' : ''}
                >
                Controlar estoque
            </label>

            <div class="row">

                <div class="field">
                    <label>Estoque atual</label>
                    <input
                        id="pestoque"
                        type="number"
                        min="0"
                        value="${p.estoque || 0}"
                    >
                </div>

                <div class="field">
                    <label>Estoque mínimo</label>
                    <input
                        id="pmin"
                        type="number"
                        min="0"
                        value="${p.estoqueMinimo || 0}"
                    >
                </div>

            </div>

            <button
                class="btn"
                onclick="salvarProduto(${id || 'null'})"
            >
                Salvar produto
            </button>

        </section>
    `, 'mais');
}

function salvarProduto(id) {

    const nome = pnome.value.trim();

    const precoPrazo = Number(pprecoPrazo.value);
    const precoAvista = Number(pprecoAvista.value);

    const controlarEstoque = pcontrola.checked;

    const estoque = Number(pestoque.value || 0);
    const estoqueMinimo = Number(pmin.value || 0);

    const atualizadoEm = new Date().toISOString();

    if (
        !nome ||
        precoPrazo < 0 ||
        precoAvista < 0
    ) {
        return alert('Preencha os dados.');
    }

    if (id) {

        const produtoAtual = db.produtos.find(p => p.id == id);

        Object.assign(produtoAtual, {
            nome,
            precoPrazo,
            precoAvista,
            controlarEstoque,
            estoque,
            estoqueMinimo,
            atualizadoEm
        });

    } else {

        db.produtos.push({
            id: Date.now(),
            nome,
            precoPrazo,
            precoAvista,
            controlarEstoque,
            estoque,
            estoqueMinimo,
            atualizadoEm
        });

    }

    save();
    produtos();
}

function excluirProduto(id) {
    const p = db.produtos.find(x => x.id == id);

    if (!p) return;

    const possuiVendas = db.vendas.some(v =>
        v.itens?.some(i => i.produtoId == id)
    );

    let mensagem = `Tem certeza que deseja excluir o produto "${p.nome}"?`;

    if (possuiVendas) {
        mensagem +=
            '\n\nEsse produto já aparece em vendas registradas. ' +
            'Ele será removido apenas do cadastro atual, ' +
            'mas continuará aparecendo no histórico dessas vendas.';
    }

    if (!confirm(mensagem)) return;

    // Registra a exclusão para o sistema de sincronização
    registrarExclusao('produtos', id);

    // Remove somente do cadastro de produtos
    db.produtos = db.produtos.filter(x => x.id != id);

    save();

    produtos();
}

function precoProduto(produto, pagamento) {

    if (pagamento === 'avista') {
        return Number(
            produto.precoAvista ??
            produto.precoPrazo ??
            produto.preco ??
            0
        );
    }

    return Number(
        produto.precoPrazo ??
        produto.preco ??
        0
    );
}

function ajustarEstoque(itens, sinal, motivo) {

    itens.forEach(i => {

        // Produto personalizado não possui estoque
        if (i.personalizado || !i.produtoId) {
            return;
        }

        const p = produto(i.produtoId);

        if (!p || !p.controlarEstoque) {
            return;
        }

        const agora =
            new Date().toISOString();

        p.estoque =
            Number(p.estoque || 0) +
            (sinal * i.quantidade);

        p.atualizadoEm = agora;

        db.movimentacoesEstoque.push({
            id: Date.now() + Math.random(),
            produtoId: p.id,
            tipo: sinal > 0 ? 'entrada' : 'saida',
            quantidade: i.quantidade,
            data: agora,
            motivo,
            atualizadoEm: agora
        });

    });
}

// ---------------------------- VENDAS -------------------------------
function novaVenda() {
    window.produtosPersonalizadosVenda = [];
    shell('Nova venda', `
        <section class="card">

            <div class="field">
                <label>Cliente *</label>

                <input
                    id="buscaClienteVenda"
                    type="search"
                    placeholder="Digite o nome do cliente..."
                    oninput="filtrarClientesVenda()"
                    autocomplete="off"
                >

                <div
                    id="listaClientesVenda"
                    class="client-search-results"
                ></div>

                <input id="vcliente" type="hidden">

                <div
                    id="clienteSelecionadoVenda"
                    class="selected-client muted"
                >
                    Nenhum cliente selecionado.
                </div>
            </div>

            <h3>Produtos</h3>

            ${
                db.produtos.map(p => `
                    <div class="product-line">

                        <span>
                            <b>${escapeHtml(p.nome)}</b><br>

                            <small>
                                ${money(precoProduto(p, 'prazo'))}
                                ${
                                    p.controlarEstoque
                                        ? ` · ${p.estoque} un.`
                                        : ''
                                }
                            </small>
                        </span>

                        <input
                            class="qtd"
                            data-id="${p.id}"
                            type="number"
                            min="0"
                            value="0"
                            oninput="calcVenda()"
                        >

                        <span id="sub${p.id}">
                            ${money(0)}
                        </span>

                    </div>
                `).join('')
                || '<div class="empty">Cadastre produtos primeiro.</div>'
            }


            <!-- PRODUTO PERSONALIZADO -->

            <div class="custom-product-box">

                <h3>➕ Produto personalizado</h3>

                <div class="field">
                    <label>Nome do produto</label>

                    <input
                        id="personalizadoNome"
                        type="text"
                        placeholder="Ex.: Serviço, taxa, item avulso..."
                    >
                </div>

                <div class="row">

                    <div class="field">
                        <label>Preço</label>

                        <input
                            id="personalizadoPreco"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                        >
                    </div>

                    <div class="field">
                        <label>Quantidade</label>

                        <input
                            id="personalizadoQuantidade"
                            type="number"
                            min="1"
                            step="1"
                            value="1"
                        >
                    </div>

                </div>

                <button
                    type="button"
                    class="btn secondary"
                    onclick="adicionarProdutoPersonalizado()"
                >
                    + Adicionar produto
                </button>

            </div>


            <!-- ITENS PERSONALIZADOS DA VENDA -->

            <div id="listaProdutosPersonalizados"></div>


            <div class="field">
                <label>Pagamento *</label>

                <select
                    id="vpagamento"
                    onchange="calcVenda()"
                >
                    <option value="prazo">A prazo</option>
                    <option value="avista">À vista</option>
                </select>

                <small class="muted">
                    Escolha "À vista" quando o comprador pagar no momento da compra.
                </small>
            </div>


            <div class="field">
                <label>Observação</label>

                <textarea
                    id="vobs"
                    placeholder="Opcional"
                ></textarea>
            </div>


            <h2>
                Total:
                <span id="vtotal">${money(0)}</span>
            </h2>


            <button
                class="btn"
                onclick="salvarVenda()"
            >
                Confirmar venda
            </button>

        </section>
    `, 'vendas');

    // Guarda os personalizados somente enquanto a venda está sendo montada.
    window.produtosPersonalizadosVenda = [];

    calcVenda();
}

function filtrarClientesVenda() {
    const campo = document.querySelector('#buscaClienteVenda');
    const lista = document.querySelector('#listaClientesVenda');

    if (!campo || !lista) return;

    const termo = campo.value.trim().toLowerCase();

    document.querySelector('#vcliente').value = '';

    if (!termo) {
        lista.innerHTML = '';
        return;
    }

    const encontrados = db.clientes.filter(c =>
        c.nome.toLowerCase().includes(termo)
    );

    if (!encontrados.length) {
        lista.innerHTML = `
            <div class="empty">
                <div>Nenhum cliente encontrado.</div>

                <button
                    class="btn"
                    style="margin-top:10px"
                    onclick="cadastrarClienteDaVenda()"
                >
                    + Cadastrar "${escapeHtml(campo.value.trim())}"
                </button>
            </div>
        `;

        return;
    }

    lista.innerHTML = encontrados.map(c => `
        <div
            class="client-search-item"
            onclick="selecionarClienteVenda(${c.id})"
        >
            <strong>${escapeHtml(c.nome)}</strong>
            ${c.telefone
                ? `<small>${escapeHtml(c.telefone)}</small>`
                : ''
            }
        </div>
    `).join('');
}

function cadastrarClienteDaVenda() {

    const campo = document.querySelector('#buscaClienteVenda');

    if (!campo) return;

    const nomeDigitado = campo.value.trim();

    if (!nomeDigitado) {
        return alert('Digite o nome do cliente.');
    }

    formCliente(null, nomeDigitado);
}

function selecionarClienteVenda(id) { const c=cliente(id); vcliente.value=id; buscaClienteVenda.value=c.nome; listaClientesVenda.innerHTML=''; clienteSelecionadoVenda.innerHTML=`Cliente selecionado: <strong>${escapeHtml(c.nome)}</strong>`; }

function adicionarProdutoPersonalizado() {

    const nomeInput = document.querySelector('#personalizadoNome');
    const precoInput = document.querySelector('#personalizadoPreco');
    const quantidadeInput = document.querySelector('#personalizadoQuantidade');

    if (!nomeInput || !precoInput || !quantidadeInput) return;

    const nome = nomeInput.value.trim();
    const preco = Number(precoInput.value);
    const quantidade = Number(quantidadeInput.value);

    if (!nome) {
        return alert('Informe o nome do produto.');
    }

    if (!Number.isFinite(preco) || preco < 0) {
        return alert('Informe um preço válido.');
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        return alert('Informe uma quantidade válida.');
    }

    if (!window.produtosPersonalizadosVenda) {
        window.produtosPersonalizadosVenda = [];
    }

    const item = {
        id: Date.now() + Math.random(),
        produtoId: null,
        personalizado: true,
        nome,
        quantidade,
        preco,
        subtotal: quantidade * preco
    };

    window.produtosPersonalizadosVenda.push(item);

    nomeInput.value = '';
    precoInput.value = '';
    quantidadeInput.value = 1;

    renderizarProdutosPersonalizados();

    calcVenda();
}


function removerProdutoPersonalizado(id) {

    if (!window.produtosPersonalizadosVenda) return;

    window.produtosPersonalizadosVenda =
        window.produtosPersonalizadosVenda.filter(
            item => item.id != id
        );

    renderizarProdutosPersonalizados();

    calcVenda();
}


function renderizarProdutosPersonalizados() {

    const container =
        document.querySelector('#listaProdutosPersonalizados');

    if (!container) return;

    const itens = window.produtosPersonalizadosVenda || [];

    if (!itens.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="custom-products-list">

            <h3>Produtos personalizados adicionados</h3>

            ${itens.map(item => `
                <div class="product-line custom-product-item">

                    <span>
                        <b>${escapeHtml(item.nome)}</b><br>
                        <small>
                            ${item.quantidade}x
                            ${money(item.preco)}
                        </small>
                    </span>

                    <span>
                        ${money(item.subtotal)}
                    </span>

                    <button
                        type="button"
                        class="btn secondary"
                        onclick="removerProdutoPersonalizado(${item.id})"
                    >
                        🗑️
                    </button>

                </div>
            `).join('')}

        </div>
    `;
}

function calcVenda() {

    let total = 0;

    const pagamento =
        document.querySelector('#vpagamento')?.value || 'prazo';


    // Produtos cadastrados
    document.querySelectorAll('.qtd').forEach(i => {

        const p = produto(i.dataset.id);

        if (!p) return;

        const q = Number(i.value);

        const preco =
            precoProduto(p, pagamento);

        const subtotal =
            preco * q;

        total += subtotal;

        const elemento =
            document.querySelector('#sub' + p.id);

        if (elemento) {
            elemento.textContent =
                money(subtotal);
        }

    });


    // Produtos personalizados
    const personalizados =
        window.produtosPersonalizadosVenda || [];

    personalizados.forEach(item => {

        total += Number(item.subtotal || 0);

    });


    const totalElemento =
        document.querySelector('#vtotal');

    if (totalElemento) {
        totalElemento.textContent =
            money(total);
    }
}

function coletarItensVenda() {

    const itens = [];
    let total = 0;
    let erro = '';

    const pagamento =
        document.querySelector('#vpagamento')?.value || 'prazo';


    // ==========================================
    // PRODUTOS CADASTRADOS
    // ==========================================

    document.querySelectorAll('.qtd').forEach(i => {

        const q = Number(i.value);
        const p = produto(i.dataset.id);

        if (!p || q <= 0) return;


        if (
            p.controlarEstoque &&
            q > Number(p.estoque || 0)
        ) {
            erro =
                `Estoque insuficiente de ${p.nome}. ` +
                `Disponível: ${p.estoque}.`;
        }


        const preco =
            precoProduto(p, pagamento);

        const subtotal =
            q * preco;


        itens.push({
            produtoId: p.id,
            personalizado: false,
            nome: p.nome,
            quantidade: q,
            preco: preco,
            subtotal: subtotal
        });


        total += subtotal;

    });


    // ==========================================
    // PRODUTOS PERSONALIZADOS
    // ==========================================

    const personalizados =
        window.produtosPersonalizadosVenda || [];


    personalizados.forEach(item => {

        const quantidade =
            Number(item.quantidade || 0);

        const preco =
            Number(item.preco || 0);

        if (
            !item.nome ||
            quantidade <= 0
        ) {
            return;
        }


        const subtotal =
            quantidade * preco;


        itens.push({
            produtoId: null,
            personalizado: true,
            nome: item.nome,
            quantidade: quantidade,
            preco: preco,
            subtotal: subtotal
        });


        total += subtotal;

    });


    return {
        itens,
        total,
        erro
    };
}

function salvarVenda() {

    if (!vcliente.value) {
        return alert('Selecione o cliente.');
    }

    const {
        itens,
        total,
        erro
    } = coletarItensVenda();

    if (erro) {
        return alert(erro);
    }

    if (!itens.length) {
        return alert('Adicione pelo menos um produto ou produto personalizado.');
    }

    const formaPagamento =
        document.querySelector('#vpagamento')?.value || 'prazo';

    // Ajusta estoque somente dos produtos cadastrados
    ajustarEstoque(itens, -1, 'Venda');

    const agora = new Date().toISOString();

    const vendaId = Date.now();

    db.vendas.push({
        id: vendaId,
        clienteId: Number(vcliente.value),
        data: agora,
        observacao: vobs.value.trim(),
        itens,
        total,
        pagamento: formaPagamento,
        atualizadoEm: agora
    });

    if (formaPagamento === 'avista') {

        db.pagamentos.push({
            id: vendaId + 1,
            clienteId: Number(vcliente.value),
            valor: total,
            data: agora,
            forma: 'avista',
            vendaId
        });

    }

    save();

    // Limpa os personalizados depois de salvar
    window.produtosPersonalizadosVenda = [];

    alert('Venda registrada!');

    vendas();
}

function vendas() { shell('Vendas', `<div class="toolbar"><h2>Vendas</h2><button class="btn" onclick="novaVenda()">+ Nova venda</button></div><div class="list">${db.vendas.slice().reverse().map(v=>`<div class="sale-card"><div class="sale-card-main"><div><b>${escapeHtml(cliente(v.clienteId).nome)}</b><div class="muted">${dt(v.data)} · ${v.itens.map(i=>i.quantidade+'x '+escapeHtml(i.nome)).join(', ')} · <strong>${(v.pagamento||'prazo')==='avista'?'À vista':'A prazo'}</strong></div>${v.observacao?`<div class="muted">Obs.: ${escapeHtml(v.observacao)}</div>`:''}</div><span class="price">${money(v.total)}</span></div><div class="sale-card-actions"><button class="btn secondary" onclick="editarVenda(${v.id})">✏️ Editar venda</button></div></div>`).join('')||'<div class="empty">Nenhuma venda.</div>'}</div>`, 'vendas'); }

function editarVenda(id) {
    const v = db.vendas.find(x => x.id == id);
    if (!v) return;

    const formaPagamentoAtual =
        v.pagamento ||
        ((db.pagamentos || []).some(p => p.vendaId == v.id) ? 'avista' : 'prazo');

    // Mantém os itens personalizados da venda disponíveis durante a edição.
    window.produtosPersonalizadosVenda = (v.itens || [])
        .filter(item => item.personalizado || !item.produtoId)
        .map(item => ({
            id: Date.now() + Math.random(),
            produtoId: null,
            personalizado: true,
            nome: item.nome,
            quantidade: Number(item.quantidade || 0),
            preco: Number(item.preco || 0),
            subtotal: Number(item.quantidade || 0) * Number(item.preco || 0)
        }));

    shell('Editar venda', `
        <section class="card">
            <div class="notice">
                Venda de <strong>${escapeHtml(cliente(v.clienteId).nome)}</strong>
                em ${dt(v.data)}.
            </div>

            <div class="field">
                <label>Cliente *</label>
                <input id="buscaClienteVenda" type="search"
                    value="${escapeHtml(cliente(v.clienteId).nome)}"
                    oninput="filtrarClientesVenda()">
                <div id="listaClientesVenda" class="client-search-results"></div>
                <input id="vcliente" type="hidden" value="${v.clienteId}">
                <div id="clienteSelecionadoVenda" class="selected-client muted">
                    Cliente selecionado: <strong>${escapeHtml(cliente(v.clienteId).nome)}</strong>
                </div>
            </div>

            <h3>Produtos</h3>

            ${db.produtos.map(p => {
                const antigo = v.itens.find(i => !i.personalizado && i.produtoId == p.id);
                const q = antigo?.quantidade || 0;
                return `
                    <div class="product-line">
                        <span>
                            <b>${escapeHtml(p.nome)}</b><br>
                            <small>
                                A prazo: ${money(p.precoPrazo ?? p.preco)}
                                · À vista: ${money(p.precoAvista ?? p.precoPrazo ?? p.preco)}
                                ${p.controlarEstoque ? ` · disponível ${p.estoque + q}` : ''}
                            </small>
                        </span>
                        <input class="qtd" data-id="${p.id}" data-old="${q}"
                            type="number" min="0" value="${q}" oninput="calcVenda()">
                        <span id="sub${p.id}">${money(precoProduto(p, formaPagamentoAtual) * q)}</span>
                    </div>
                `;
            }).join('')}

            <div class="custom-product-box">
                <h3>➕ Produto personalizado</h3>

                <div class="field">
                    <label>Nome do produto</label>
                    <input id="personalizadoNome" type="text"
                        placeholder="Ex.: Serviço, taxa, item avulso...">
                </div>

                <div class="row">
                    <div class="field">
                        <label>Preço</label>
                        <input id="personalizadoPreco" type="number" min="0" step="0.01" placeholder="0,00">
                    </div>
                    <div class="field">
                        <label>Quantidade</label>
                        <input id="personalizadoQuantidade" type="number" min="1" step="1" value="1">
                    </div>
                </div>

                <button type="button" class="btn secondary" onclick="adicionarProdutoPersonalizado()">
                    + Adicionar produto
                </button>
            </div>

            <div id="listaProdutosPersonalizados"></div>

            <div class="field">
                <label>Pagamento *</label>
                <select id="vpagamento" onchange="calcVenda()">
                    <option value="prazo" ${formaPagamentoAtual === 'prazo' ? 'selected' : ''}>A prazo</option>
                    <option value="avista" ${formaPagamentoAtual === 'avista' ? 'selected' : ''}>À vista</option>
                </select>
            </div>

            <div class="field">
                <label>Observação</label>
                <textarea id="vobs">${escapeHtml(v.observacao || '')}</textarea>
            </div>

            <h2>Total: <span id="vtotal">${money(v.total)}</span></h2>
            <button class="btn" onclick="salvarEdicaoVenda(${v.id})">Salvar alterações</button>
        </section>
    `, 'vendas');

    renderizarProdutosPersonalizados();
    calcVenda();
}

function salvarEdicaoVenda(id) {

    const v = db.vendas.find(x => x.id == id);

    if (!v) return;

    const itens = [];
    let total = 0;

    const pagamento =
        document.querySelector('#vpagamento')?.value || 'prazo';

    for (const i of document.querySelectorAll('.qtd')) {

        const q = Number(i.value);
        const old = Number(i.dataset.old || 0);
        const p = produto(i.dataset.id);

        if (
            p.controlarEstoque &&
            q > Number(p.estoque || 0) + old
        ) {
            return alert(
                `Estoque insuficiente de ${p.nome}.`
            );
        }

        if (q > 0) {

            const preco = precoProduto(p, pagamento);
            const subtotal = q * preco;

            itens.push({
                produtoId: p.id,
                nome: p.nome,
                quantidade: q,
                preco: preco,
                subtotal: subtotal
            });

            total += subtotal;
        }
    }

    // Preserva e inclui os produtos personalizados durante a edição.
    const personalizados = window.produtosPersonalizadosVenda || [];

    personalizados.forEach(item => {
        const quantidade = Number(item.quantidade || 0);
        const preco = Number(item.preco || 0);

        if (!item.nome || quantidade <= 0) return;

        const subtotal = quantidade * preco;

        itens.push({
            produtoId: null,
            personalizado: true,
            nome: item.nome,
            quantidade,
            preco,
            subtotal
        });

        total += subtotal;
    });

    if (!itens.length) {
        return alert('Adicione pelo menos um produto ou produto personalizado.');
    }

    if (
        !confirm(
            `Salvar alterações?\n\nNovo total: ${money(total)}`
        )
    ) {
        return;
    }

    ajustarEstoque(
        v.itens,
        +1,
        'Estorno por edição'
    );

    ajustarEstoque(
        itens,
        -1,
        'Venda editada'
    );

    const agora = new Date().toISOString();

    db.pagamentos =
        (db.pagamentos || [])
        .filter(p => p.vendaId != v.id);

    Object.assign(v, {
        clienteId: Number(vcliente.value),
        observacao: vobs.value.trim(),
        itens,
        total,
        pagamento,
        editadoEm: agora,
        atualizadoEm: agora
    });

    if (pagamento === 'avista') {

        db.pagamentos.push({
            id: Date.now() + 1,
            clienteId: Number(vcliente.value),
            valor: total,
            data: agora,
            forma: 'avista',
            vendaId: v.id
        });
    }

    save();

    window.produtosPersonalizadosVenda = [];

    vendas();
}

// -------------------------- RELATÓRIOS -----------------------------
function relatorios() {
  shell('Relatórios', `
    <section class="card">

      <div class="row">
        <div class="field">
          <label>De</label>
          <input id="rini" type="date">
        </div>

        <div class="field">
          <label>Até</label>
          <input id="rfim" type="date">
        </div>
      </div>

      <div class="field">
        <label>Cliente</label>

        <input
          id="buscaClienteRelatorio"
          type="search"
          placeholder="Digite o nome do cliente..."
          oninput="filtrarClientesRelatorio()"
          autocomplete="off"
        >

        <div
          id="listaClientesRelatorio"
          class="client-search-results"
        ></div>

        <input
          id="rcli"
          type="hidden"
          value=""
        >

        <div
          id="clienteSelecionadoRelatorio"
          class="selected-client muted"
        >
          Todos os clientes.
        </div>
      </div>

      <button class="btn" onclick="gerarRelatorio()">
        Gerar relatório
      </button>

    </section>

    <div id="resultado"></div>
  `, 'relatorios');
}

function filtrarClientesRelatorio() {
  const campo = document.querySelector('#buscaClienteRelatorio');
  const lista = document.querySelector('#listaClientesRelatorio');
  const selecionado = document.querySelector('#rcli');

  if (!campo || !lista || !selecionado) return;

  const termo = campo.value.trim().toLowerCase();

  // Sempre que o usuário alterar o texto,
  // o cliente anteriormente selecionado é removido.
  selecionado.value = '';

  if (!termo) {
    lista.innerHTML = '';
    document.querySelector('#clienteSelecionadoRelatorio').innerHTML =
      'Todos os clientes.';
    return;
  }

  const encontrados = db.clientes.filter(c =>
    c.nome.toLowerCase().includes(termo)
  );

  if (!encontrados.length) {
    lista.innerHTML = `
      <div class="empty">
        Nenhum cliente encontrado.
      </div>
    `;
    return;
  }

  lista.innerHTML = encontrados.map(c => `
    <div
      class="client-search-item"
      onclick="selecionarClienteRelatorio(${c.id})"
    >
      <strong>${escapeHtml(c.nome)}</strong>

      ${
        c.telefone
          ? `<small>${escapeHtml(c.telefone)}</small>`
          : ''
      }
    </div>
  `).join('');
}


function selecionarClienteRelatorio(id) {
  const c = cliente(id);

  const campo = document.querySelector('#buscaClienteRelatorio');
  const lista = document.querySelector('#listaClientesRelatorio');
  const selecionado = document.querySelector('#rcli');
  const texto = document.querySelector('#clienteSelecionadoRelatorio');

  if (!campo || !lista || !selecionado || !texto) return;

  selecionado.value = id;

  campo.value = c.nome;

  lista.innerHTML = '';

  texto.innerHTML = `
    Cliente selecionado:
    <strong>${escapeHtml(c.nome)}</strong>
  `;
}

function gerarRelatorio() { const inicio=rini.value?new Date(rini.value+'T00:00:00'):null,
fim=rfim.value?new Date(rfim.value+'T23:59:59'):null,
cli=rcli.value; const ok=d=>(!inicio||new Date(d)>=inicio)&&(!fim||new Date(d)<=fim); const vs=db.vendas.filter(v=>ok(v.data)&&(!cli||v.clienteId==cli)), ps=db.pagamentos.filter(p=>ok(p.data)&&(!cli||p.clienteId==cli)); const grupos={}; const grupo=id=>grupos[id]||(grupos[id]={total:0,pago:0,prazo:{total:0,itens:{}},avista:{total:0,itens:{}}}); vs.forEach(v=>{const g=grupo(v.clienteId);const tipo=(v.pagamento||'prazo')==='avista'?'avista':'prazo';g.total+=v.total;g[tipo].total+=v.total;v.itens.forEach(i=>{g[tipo].itens[i.nome]=(g[tipo].itens[i.nome]||0)+i.quantidade})}); ps.forEach(p=>grupo(p.clienteId).pago+=p.valor); const tv=vs.reduce((s,v)=>s+v.total,0),tp=ps.reduce((s,p)=>s+p.valor,0); const itensTexto=g=>Object.entries(g.itens).map(([n,q])=>q+' '+escapeHtml(n)).join(', ')||'-'; 

const linhas = Object.entries(grupos).map(([id, g], indice) => {
  const classe = indice % 2 === 0 ? 'cliente-par' : 'cliente-impar';

  return `
    <tr class="${classe}">
      <td rowspan="2">${escapeHtml(cliente(id).nome)}</td>
      <td><strong>A prazo</strong></td>
      <td>${money(g.prazo.total)}</td>
      <td>${itensTexto(g.prazo)}</td>
    </tr>

    <tr class="${classe}">
      <td><strong>À vista</strong></td>
      <td>${money(g.avista.total)}</td>
      <td>${itensTexto(g.avista)}</td>
    </tr>
  `;
}).join(''); 

let detalhe=''; if(cli){detalhe=`<section class="card"><h3>Detalhamento de ${escapeHtml(cliente(cli).nome)}</h3>${vs.sort((a,b)=>new Date(a.data)-new Date(b.data)).map(v=>`<div class="detail-sale"><div class="toolbar"><div><b>${new Date(v.data).toLocaleDateString('pt-BR')}</b><div class="muted">${new Date(v.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · <strong>${(v.pagamento||'prazo')==='avista'?'À vista':'A prazo'}</strong></div></div><strong>${money(v.total)}</strong></div>${v.itens.map(i=>`<div>${i.quantidade}x ${escapeHtml(i.nome)} — ${money(i.subtotal)}</div>`).join('')}${v.observacao?`<div class="muted">Obs.: ${escapeHtml(v.observacao)}</div>`:''}</div>`).join('')||'<div class="empty">Nenhuma compra.</div>'}<h3>Pagamentos</h3>${ps.map(p=>`<div class="item"><span>${dt(p.data)}</span><b>${money(p.valor)}</b></div>`).join('')||'<div class="empty">Nenhum pagamento.</div>'}</section>`;} resultado.innerHTML=`<section class="card"><div class="toolbar"><h3>Resultado do relatório</h3><button class="btn" onclick="exportarRelatorioPDF()">📄 Exportar PDF</button></div><div class="report-summary"><div><span>Vendido</span><strong>${money(tv)}</strong></div><div><span>Pago</span><strong>${money(tp)}</strong></div><div><span>Em aberto</span><strong>${money(Math.max(0,tv-tp))}</strong></div></div><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Pagamento</th><th>Total</th><th>Itens</th></tr></thead><tbody>${linhas||'<tr><td colspan="4">Nenhum movimento.</td></tr>'}</tbody></table></div></section>${detalhe}`; }

// ----------------------- EXPORTAÇÃO PARA PDF ----------------------
// Não usamos uma biblioteca externa aqui. O botão cria uma versão limpa
// do relatório e abre a impressão do navegador. No Android/Chrome e nos
// navegadores de desktop, basta escolher "Salvar como PDF".
function exportarRelatorioPDF() {
  const conteudo = document.querySelector('#resultado');
  if (!conteudo || !conteudo.innerText.trim()) {
    alert('Gere um relatório antes de exportar.');
    return;
  }

  const inicio = document.querySelector('#rini')?.value;
  const fim = document.querySelector('#rfim')?.value;
  const clienteId = document.querySelector('#rcli')?.value;
  const nomeCliente = clienteId ? cliente(clienteId).nome : 'Todos os clientes';
  const formatarData = valor => valor ? new Date(valor + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem limite';

  // Clonamos o relatório para remover apenas os controles que não devem
  // aparecer no documento final, como o próprio botão Exportar PDF.
  const clone = conteudo.cloneNode(true);
  clone.querySelectorAll('button').forEach(botao => botao.remove());

  const janela = window.open('', '_blank');
  if (!janela) {
    alert('O navegador bloqueou a janela de impressão. Permita pop-ups para o AnotaAí e tente novamente.');
    return;
  }

  janela.document.write(`<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório AnotaAí</title>
  <style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#172033;margin:0;font-size:12px}header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0b2855;padding-bottom:12px;margin-bottom:18px}h1{margin:0;color:#0b2855;font-size:24px}h2,h3{color:#0b2855}.meta{margin-top:5px;color:#596474}.report-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.report-summary div{border:1px solid #dfe5ec;border-radius:8px;padding:10px}.report-summary span{display:block;color:#667085;font-size:11px;margin-bottom:4px}.report-summary strong{font-size:15px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    table tbody tr.cliente-impar td{
    background:#f5f7fa;}
    table tbody tr.cliente-par td{
    background:#fff;}
    th,td{border:1px solid #dfe5ec;
    padding:7px;
    text-align:left;
    vertical-align:top}
    th{background:#f3f6f9;
    color:#0b2855}.card{margin-bottom:18px}.toolbar{display:block}.detail-sale{border:1px solid #dfe5ec;border-radius:8px;padding:10px;margin:8px 0;break-inside:avoid}.item{display:flex;justify-content:space-between;border-bottom:1px solid #e8edf2;padding:8px 0}.muted{color:#667085}.empty{color:#667085;padding:10px 0}.table-wrap{overflow:visible}.home-footer,.nav,.fab-sale{display:none!important}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <header><div><h1>AnotaAí</h1><div class="meta">Relatório de vendas e pagamentos</div></div><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')}</div></header>
  <section class="meta"><b>Período:</b> ${formatarData(inicio)} até ${formatarData(fim)}<br><b>Cliente:</b> ${escapeHtml(nomeCliente)}</section>
  ${clone.innerHTML}
  <script>window.onload=()=>{setTimeout(()=>window.print(),250)}<\/script>
  </body></html>`);
  janela.document.close();
}


// ----------------------------- MAIS -------------------------------
function mais() {
  const instalado = appEstaInstalado();
  const codigoBackup = localStorage.getItem('anotaaiBackupCode') || '';
  const ultimoBackup = localStorage.getItem('anotaaiUltimoBackup');
  const apiConfigurada = backupApiConfigurada();
  const licenca = localStorage.getItem('anotaaiLicenseCode') || '';
  const autoSync = localStorage.getItem('anotaaiAutoSync') !== 'false';
  const ultimaSync = localStorage.getItem('anotaaiUltimaSync');
  const agendaBackup = obterAgendaBackup();
  const proximoBackup = descreverProximoBackup();
  shell('Mais opções', `<section class="grid"><button class="action blue" onclick="clientes()"><b>👥 Clientes</b><span>Cadastros e cobranças</span></button><button class="action orange" onclick="produtos()"><b>📦 Produtos</b><span>Produtos e estoque</span></button><button class="action purple" onclick="configUsuario()"><b>👤 Usuário</b><span>Seu nome e dados PIX</span></button></section>
  <section class="card app-install-card">
    <div class="app-install-info"><div class="app-install-icon">📱</div><div><h3>Aplicativo AnotaAí</h3><p class="muted" id="installAppStatus">${instalado ? 'O AnotaAí já está instalado neste aparelho.' : 'Instale para abrir pela tela inicial e usar como aplicativo.'}</p></div></div>
    <button id="installAppBtn" class="btn install-btn ${instalado ? 'installed' : ''}" onclick="instalarApp()" ${instalado ? 'disabled' : ''}>${instalado ? '✓ Aplicativo instalado' : '⬇ Instalar AnotaAí'}</button>
  </section>
  <section class="card backup-card">
    <div class="toolbar"><div><h3>☁️ Backup online</h3><p class="muted">Salve e recupere os dados em outro aparelho.</p></div><span class="backup-dot ${apiConfigurada ? 'ready' : ''}" title="${apiConfigurada ? 'API configurada' : 'API não configurada'}"></span></div>
    ${codigoBackup ? `<div class="backup-code"><span>Código de recuperação</span><strong>${escapeHtml(codigoBackup)}</strong><button class="btn secondary" onclick="copiarCodigoBackup()">Copiar código</button></div>` : '<p class="notice">No primeiro backup será criado um código secreto. Guarde-o para restaurar os dados em outro aparelho.</p>'}
    <div class="backup-actions">
      <button class="btn" onclick="salvarBackupOnline()">${codigoBackup ? 'Atualizar backup online' : 'Criar backup online'}</button>
      <button class="btn secondary" onclick="abrirRestauracaoOnline()">Restaurar e mesclar</button>
      <button class="btn secondary" onclick="exportarBackupArquivo()">Baixar arquivo de backup</button>
      <label class="btn secondary backup-file-label">Restaurar de arquivo<input type="file" accept="application/json,.json" onchange="restaurarBackupArquivo(this.files[0]);this.value=''" hidden></label>
      <button class="btn sync-now" onclick="sincronizarAgora()">🔄 Sincronizar agora</button>
    </div>
    <label class="checkline sync-toggle"><input type="checkbox" ${autoSync?'checked':''} onchange="configurarSyncAutomatica(this.checked)"> Sincronização automática</label>
    <div class="backup-schedule">
      <div class="backup-schedule-head"><div><h4>⏰ Horários do backup</h4><p class="muted">Escolha até três horários por dia.</p></div><select id="quantidadeBackups" onchange="configurarQuantidadeBackups(this.value)">${[1,2,3].map(n=>`<option value="${n}" ${agendaBackup.length===n?'selected':''}>${n}x por dia</option>`).join('')}</select></div>
      <div class="backup-time-grid" id="camposHorarioBackup">${agendaBackup.map((hora,i)=>`<div class="field"><label>Backup ${i+1}</label><input type="time" class="backup-time" value="${escapeHtml(hora)}"></div>`).join('')}</div>
      <button class="btn secondary schedule-save" onclick="salvarAgendaBackup()">Salvar horários</button>
      <p class="muted schedule-next" id="proximoBackupStatus">${escapeHtml(proximoBackup)}</p>
      <p class="muted schedule-note">O app executa no horário enquanto estiver aberto. Se estiver fechado, realiza o backup pendente quando for aberto novamente.</p>
    </div>
    <p class="muted backup-status" id="backupStatus">${ultimaSync ? `Última sincronização: ${new Date(ultimaSync).toLocaleString('pt-BR')}` : (ultimoBackup ? `Último backup online: ${new Date(ultimoBackup).toLocaleString('pt-BR')}` : 'Nenhum backup online realizado neste aparelho.')}</p>
  </section>
  <section class="card license-card"><h3>🔑 Licença</h3><p class="muted">${licenca ? `Licença ativa neste aparelho · final ${escapeHtml(licenca.slice(-4))}` : 'Nenhuma licença ativada.'}</p><button class="btn secondary" onclick="trocarLicenca()">Trocar licença</button></section>
  <section class="card support-card"><h3>💬 Suporte</h3><p class="muted">Precisa de ajuda com o AnotaAí? Fale diretamente com o suporte pelo WhatsApp.</p><button class="btn whatsapp-btn" onclick="window.open('https://wa.me/5512988384166','_blank','noopener')">💬 Falar com o suporte</button></section>
  <section class="card"><h3>Dados locais</h3><p class="muted">Os dados também ficam salvos neste aparelho e navegador.</p><button class="btn danger" onclick="abrirLimpeza()">Limpar dados locais</button></section>`, 'mais');
}

// -------------------------- BACKUP -------------------------------
// O GitHub Pages continua hospedando o aplicativo. A URL abaixo aponta para
// a pequena API PHP instalada separadamente na SmileHost.
const BACKUP_LISTAS = ['clientes','produtos','vendas','pagamentos','movimentacoesEstoque','cobrancas'];
let timerBackupOnline = null;
let timerAgendaBackup = null;
let backupAgendadoEmAndamento = false;
let sincronizacaoOnlineEmAndamento = null;
let eventosAgendaConfigurados = false;

function backupApiConfigurada() {
  const url = String(window.ANOTAAI_BACKUP_API || '').trim();
  return /^https:\/\//i.test(url) && !url.includes('SEU-DOMINIO');
}

function gerarCodigoBackup() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function pacoteBackup() {
  return {
    app: 'AnotaAí',
    versao: 26,
    criadoEm: new Date().toISOString(),
    dados: JSON.parse(JSON.stringify(db))
  };
}

async function chamarApiBackup(action, code, data) {
  if (!backupApiConfigurada()) throw new Error('Configure a URL da API no arquivo backup-config.js antes de publicar.');
  const resposta = await fetch(window.ANOTAAI_BACKUP_API, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action, code, data, license: localStorage.getItem('anotaaiLicenseCode') || '', deviceId: obterIdDispositivo()})
  });
  let json;
  try { json = await resposta.json(); }
  catch { throw new Error('A hospedagem respondeu em um formato inválido.'); }
  if (!resposta.ok || !json.ok) throw new Error(json.error || 'Não foi possível acessar o backup.');
  return json;
}

async function salvarBackupOnline(silencioso=false) {
  let code = localStorage.getItem('anotaaiBackupCode');
  if (!code) code = gerarCodigoBackup();
  const status = document.getElementById('backupStatus');
  if (status && !silencioso) status.textContent = 'Salvando backup online...';
  try {
    await chamarApiBackup('save', code, pacoteBackup());
    localStorage.setItem('anotaaiBackupCode', code);
    localStorage.setItem('anotaaiUltimoBackup', new Date().toISOString());
    localStorage.setItem('anotaaiUltimaSync', new Date().toISOString());
    if (!silencioso) {
      alert(`Backup salvo!\n\nSeu código de recuperação é:\n${code}\n\nGuarde esse código em um lugar seguro.`);
      mais();
    }
    return true;
  } catch (erro) {
    if (!silencioso) alert(erro.message);
    if (status) status.textContent = `Falha no backup: ${erro.message}`;
    return false;
  }
}

function agendarBackupOnline() {
  if (localStorage.getItem('anotaaiAutoSync') === 'false' || !backupApiConfigurada() || !localStorage.getItem('anotaaiBackupCode')) return;
  clearTimeout(timerBackupOnline);
  timerBackupOnline = setTimeout(() => sincronizarAgora(true), 1800);
}

function copiarCodigoBackup() {
  const code = localStorage.getItem('anotaaiBackupCode');
  if (!code) return;
  navigator.clipboard?.writeText(code).then(() => alert('Código copiado!')).catch(() => prompt('Copie seu código:', code));
}

function abrirRestauracaoOnline() {
  const salvo = localStorage.getItem('anotaaiBackupCode') || '';
  const modal = document.createElement('div');
  modal.id = 'modalRestaurarBackup';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<div class="modal-box"><div class="toolbar"><div><h3>☁️ Restaurar backup</h3><p class="muted">Os dados serão mesclados, sem apagar os registros locais.</p></div><button class="modal-close" onclick="fecharModal('modalRestaurarBackup')">×</button></div><div class="field"><label>Código de recuperação</label><input id="codigoRestauracao" value="${escapeHtml(salvo)}" autocomplete="off" autocapitalize="characters" placeholder="Cole o código do outro aparelho"></div><button class="btn" onclick="restaurarBackupOnline()">Baixar e mesclar</button></div>`;
  document.body.appendChild(modal);
}

async function restaurarBackupOnline() {
  const code = document.getElementById('codigoRestauracao').value.replace(/\s/g,'').toUpperCase();
  if (code.length < 32) return alert('Informe um código de recuperação válido.');
  try {
    const resposta = await chamarApiBackup('restore', code);
    const resumo = mesclarBackup(resposta.data);
    localStorage.setItem('anotaaiBackupCode', code);
    localStorage.setItem('anotaaiUltimoBackup', new Date().toISOString());
    save();
    fecharModal('modalRestaurarBackup');
    await salvarBackupOnline(true);
    alert(`Backup restaurado e mesclado!\n\n${resumo.adicionados} registro(s) adicionados.\n${resumo.existentes} registro(s) já existiam.`);
    home();
  } catch (erro) { alert(erro.message); }
}

function validarPacoteBackup(pacote) {
  if (!pacote || pacote.app !== 'AnotaAí' || !pacote.dados || typeof pacote.dados !== 'object') throw new Error('Este arquivo não é um backup válido do AnotaAí.');
  BACKUP_LISTAS.forEach(chave => { if (!Array.isArray(pacote.dados[chave] || [])) throw new Error(`A lista ${chave} do backup é inválida.`); });
  return pacote;
}

function mesclarBackup(pacote) {
  validarPacoteBackup(pacote);
  const remoto = pacote.dados;
  let adicionados = 0, existentes = 0, atualizados = 0, excluidos = 0;
  const localVazio = BACKUP_LISTAS.every(chave => !(db[chave] || []).length);
  db.exclusoes ||= [];
  const exclusoesMap = new Map();
  [...db.exclusoes,...(remoto.exclusoes||[])].forEach(x=>{const k=x.tipo+':'+x.id,atual=exclusoesMap.get(k);if(!atual||new Date(x.excluidoEm)>new Date(atual.excluidoEm))exclusoesMap.set(k,x);});
  db.exclusoes=[...exclusoesMap.values()];
  BACKUP_LISTAS.forEach(chave => {
    db[chave] ||= [];
    const indices = new Map(db[chave].map((item,index) => [String(item.id),index]));
    (remoto[chave] || []).forEach(item => {
      const indice=indices.get(String(item.id));
      if(indice!==undefined){const local=db[chave][indice],tempoRemoto=registroTempo(item),tempoLocal=registroTempo(local);if(tempoRemoto>tempoLocal){db[chave][indice]=JSON.parse(JSON.stringify(item));atualizados++;}else existentes++;return;}
      db[chave].push(JSON.parse(JSON.stringify(item)));
      indices.set(String(item.id),db[chave].length-1);
      adicionados++;
    });
    db.exclusoes.filter(x=>x.tipo===chave).forEach(x=>{const antes=db[chave].length;db[chave]=db[chave].filter(item=>String(item.id)!==String(x.id)||registroTempo(item)>new Date(x.excluidoEm).getTime());excluidos+=antes-db[chave].length;});
  });
  // As configurações do usuário (nome e PIX) também fazem parte do backup.
  // Antes elas só eram restauradas quando TODO o banco local estava vazio. Isso
  // fazia clientes/vendas sincronizarem normalmente, mas deixava o PIX de fora.
  if (remoto.config && typeof remoto.config === 'object') {
    const configLocal = db.config || {};
    const configRemota = remoto.config || {};
    const tempoLocal = new Date(configLocal.atualizadoEm || 0).getTime() || 0;
    const tempoRemoto = new Date(configRemota.atualizadoEm || 0).getTime() || 0;

    if (tempoRemoto > tempoLocal) {
      db.config = {...configLocal, ...configRemota};
    } else {
      // Compatibilidade com backups antigos, que não possuíam atualizadoEm:
      // completa apenas campos locais vazios, sem apagar uma configuração válida.
      db.config = {
        ...configLocal,
        usuarioNome: configLocal.usuarioNome || configRemota.usuarioNome || '',
        pixChave: configLocal.pixChave || configRemota.pixChave || '',
        pixNome: configLocal.pixNome || configRemota.pixNome || '',
        incluirPix: configLocal.incluirPix ?? configRemota.incluirPix ?? true,
        personalizarCobranca: configLocal.personalizarCobranca ?? configRemota.personalizarCobranca ?? false,
        mensagemCobranca: configLocal.mensagemCobranca || configRemota.mensagemCobranca || '',
        atualizadoEm: configLocal.atualizadoEm || configRemota.atualizadoEm || ''
      };
    }
  }
  return {adicionados, existentes, atualizados, excluidos};
}

function registroTempo(item){return new Date(item?.atualizadoEm||item?.editadoEm||item?.data||0).getTime()||0;}

function configurarSyncAutomatica(ativa){localStorage.setItem('anotaaiAutoSync',ativa?'true':'false');if(ativa)sincronizarAgora(true);}

function obterAgendaBackup(){
  try {
    const agenda=JSON.parse(localStorage.getItem('anotaaiBackupHorarios'));
    if(Array.isArray(agenda)&&agenda.length)return agenda.filter(h=>/^([01]\d|2[0-3]):[0-5]\d$/.test(h)).slice(0,3);
  } catch {}
  return ['09:00'];
}

function configurarQuantidadeBackups(quantidade){
  const total=Math.max(1,Math.min(3,Number(quantidade)||1));
  const atuais=[...document.querySelectorAll('.backup-time')].map(input=>input.value);
  const padrao=['09:00','14:00','20:00'];
  const container=document.getElementById('camposHorarioBackup');
  if(container)container.innerHTML=Array.from({length:total},(_,i)=>`<div class="field"><label>Backup ${i+1}</label><input type="time" class="backup-time" value="${escapeHtml(atuais[i]||padrao[i])}"></div>`).join('');
}

function salvarAgendaBackup(){
  const horarios=[...document.querySelectorAll('.backup-time')].map(input=>input.value).filter(Boolean);
  if(!horarios.length)return alert('Escolha pelo menos um horário.');
  if(new Set(horarios).size!==horarios.length)return alert('Escolha horários diferentes para cada backup.');
  horarios.sort();
  localStorage.setItem('anotaaiBackupHorarios',JSON.stringify(horarios));
  iniciarAgendamentoBackups();
  alert('Horários de backup salvos!');
  mais();
}

function chaveDataLocal(data=new Date()){
  const y=data.getFullYear(),m=String(data.getMonth()+1).padStart(2,'0'),d=String(data.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function descreverProximoBackup(){
  const agora=new Date(),horarios=obterAgendaBackup();
  const hoje=horarios.find(h=>{const [hora,minuto]=h.split(':').map(Number);const alvo=new Date(agora);alvo.setHours(hora,minuto,0,0);return alvo>agora;});
  return hoje?`Próximo backup hoje às ${hoje}.`:`Próximo backup amanhã às ${horarios[0]}.`;
}

function marcarHorariosVencidosExecutados(){
  const agora=new Date(),data=chaveDataLocal(agora),executados=JSON.parse(localStorage.getItem('anotaaiBackupsExecutados')||'{}');
  obterAgendaBackup().forEach(h=>{const [hora,minuto]=h.split(':').map(Number);const alvo=new Date(agora);alvo.setHours(hora,minuto,0,0);if(agora>=alvo)executados[`${data}|${h}`]=new Date().toISOString();});
  localStorage.setItem('anotaaiBackupsExecutados',JSON.stringify(executados));
}

async function verificarBackupsAgendados(){
  if(backupAgendadoEmAndamento||localStorage.getItem('anotaaiAutoSync')==='false'||!navigator.onLine||!backupApiConfigurada()||!localStorage.getItem('anotaaiBackupCode'))return;
  const agora=new Date(),data=chaveDataLocal(agora),horarios=obterAgendaBackup();
  const executados=JSON.parse(localStorage.getItem('anotaaiBackupsExecutados')||'{}');
  const vencidos=horarios.filter(h=>{const [hora,minuto]=h.split(':').map(Number);const alvo=new Date(agora);alvo.setHours(hora,minuto,0,0);return agora>=alvo&&!executados[`${data}|${h}`];});
  if(!vencidos.length)return;
  backupAgendadoEmAndamento=true;
  const funcionou=await sincronizarAgora(true);
  if(funcionou){
    vencidos.forEach(h=>executados[`${data}|${h}`]=new Date().toISOString());
    const limite=new Date();limite.setDate(limite.getDate()-7);
    Object.keys(executados).forEach(chave=>{if(chave.slice(0,10)<chaveDataLocal(limite))delete executados[chave];});
    localStorage.setItem('anotaaiBackupsExecutados',JSON.stringify(executados));
    const status=document.getElementById('proximoBackupStatus');if(status)status.textContent=descreverProximoBackup();
  }
  backupAgendadoEmAndamento=false;
}

function iniciarAgendamentoBackups(){
  clearInterval(timerAgendaBackup);
  verificarBackupsAgendados();
  timerAgendaBackup=setInterval(verificarBackupsAgendados,30000);
  if(!eventosAgendaConfigurados){
    window.addEventListener('online',verificarBackupsAgendados);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')verificarBackupsAgendados();});
    eventosAgendaConfigurados=true;
  }
}

async function sincronizarAgora(silencioso=false){
  const code=localStorage.getItem('anotaaiBackupCode');
  if(!code){if(!silencioso)alert('Crie ou restaure um backup online primeiro.');return false;}

  // Evita duas sincronizações concorrentes (ex.: autosync + botão manual).
  // Quem chegar durante uma sincronização aguarda a mesma operação terminar.
  if(sincronizacaoOnlineEmAndamento)return await sincronizacaoOnlineEmAndamento;

  const status=document.getElementById('backupStatus');
  if(status)status.textContent='Sincronizando dados...';

  sincronizacaoOnlineEmAndamento=(async()=>{
    try{
      // 1) Baixa o estado mais recente do servidor.
      const resposta=await chamarApiBackup('restore',code);

      // 2) Mescla remoto + local respeitando atualizadoEm/editadoEm/data e exclusões.
      const resumo=mesclarBackup(resposta.data);
      localStorage.setItem('cvdb',JSON.stringify(db));

      // 3) Só depois envia ao servidor o banco já consolidado.
      const enviou=await salvarBackupOnline(true);
      if(!enviou)throw new Error('Não foi possível enviar os dados mesclados.');

      localStorage.setItem('anotaaiUltimaSync',new Date().toISOString());
      if(!silencioso){
        alert(`Sincronização concluída!\n\n${resumo.adicionados} novo(s), ${resumo.atualizados} atualizado(s) e ${resumo.excluidos} excluído(s).`);
        mais();
      }
      return true;
    }catch(erro){
      if(status)status.textContent='Sincronização pendente: '+erro.message;
      if(!silencioso)alert(erro.message);
      return false;
    }finally{
      sincronizacaoOnlineEmAndamento=null;
    }
  })();

  return await sincronizacaoOnlineEmAndamento;
}

function exportarBackupArquivo() {
  const blob = new Blob([JSON.stringify(pacoteBackup(), null, 2)], {type:'application/json'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `anotaai-backup-${hojeISO()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function restaurarBackupArquivo(arquivo) {
  if (!arquivo) return;
  try {
    const pacote = JSON.parse(await arquivo.text());
    const resumo = mesclarBackup(pacote);
    save();
    alert(`Arquivo restaurado e mesclado!\n\n${resumo.adicionados} registro(s) adicionados.\n${resumo.existentes} registro(s) já existiam.`);
    home();
  } catch (erro) { alert(erro.message || 'Não foi possível ler o arquivo.'); }
}

// --------------------- CONFIGURAÇÕES DO USUÁRIO ------------------
// Centraliza o nome exibido na Home e os dados PIX usados nas cobranças.
function configUsuario() {
  shell('Usuário', `<section class="card">
    <h3>👤 Perfil</h3>
    <div class="field"><label>Nome / nome da loja</label><input id="usuarioNome" value="${escapeHtml(db.config.usuarioNome||'')}" placeholder="Ex.: AnotaAí Doces"></div>
    <h3>💰 Dados para recebimento</h3>
    <div class="field"><label>Nome do recebedor PIX</label><input id="pixNome" value="${escapeHtml(db.config.pixNome||'')}" placeholder="Ex.: Derick Luiz"></div>
    <div class="field"><label>Chave PIX</label><input id="pixChave" value="${escapeHtml(db.config.pixChave||'')}" placeholder="CPF, telefone, e-mail ou chave aleatória"></div>
    <label class="checkline"><input id="pixIncluir" type="checkbox" ${db.config.incluirPix!==false?'checked':''}> Incluir PIX nas mensagens de cobrança</label>
    <h3>💬 Mensagem de cobrança</h3>
    <label class="checkline"><input id="personalizarCobranca" type="checkbox" ${db.config.personalizarCobranca?'checked':''} onchange="alternarMensagemCobranca()"> Personalizar mensagem de cobrança</label>
    <div id="campoMensagemCobranca" class="custom-charge-message" ${db.config.personalizarCobranca?'':'hidden'}>
      <div class="field"><label>Mensagem personalizada</label><textarea id="mensagemCobranca" rows="7" placeholder="Digite sua mensagem. Onde quiser inserir a chave PIX use {pixChave}, o nome do recebedor use {pixNome} e o nome da loja use {usuarioNome}.">${escapeHtml(db.config.mensagemCobranca||'')}</textarea></div>
      <p class="muted">Variáveis disponíveis: <code>{pixChave}</code>, <code>{pixNome}</code> e <code>{usuarioNome}</code>.</p>
    </div>
    <h3>☁️ Chave do backup</h3>
    <div class="field"><label>Código de recuperação</label><input id="backupCodeUsuario" value="${escapeHtml(localStorage.getItem('anotaaiBackupCode')||'')}" autocomplete="off" placeholder="Cole aqui o código de 48 caracteres"></div>
    <p class="muted">Use uma chave já existente para acessar o backup correspondente. Se deixar em branco, a chave deste aparelho será removida.</p>
    <button class="btn" onclick="salvarUsuario()">Salvar alterações</button>
  </section>`, 'mais');
}

function alternarMensagemCobranca() {
  const campo = document.getElementById('campoMensagemCobranca');
  if (campo) campo.hidden = !document.getElementById('personalizarCobranca')?.checked;
}

function salvarUsuario() {
  db.config.usuarioNome = usuarioNome.value.trim();
  db.config.pixNome = pixNome.value.trim();
  db.config.pixChave = pixChave.value.trim();
  db.config.incluirPix = pixIncluir.checked;
  db.config.personalizarCobranca = document.getElementById('personalizarCobranca')?.checked || false;
  db.config.mensagemCobranca = document.getElementById('mensagemCobranca')?.value.trim() || '';
  if (db.config.personalizarCobranca && !db.config.mensagemCobranca) return alert('Digite a mensagem de cobrança personalizada ou desmarque a opção de personalização.');
  db.config.atualizadoEm = new Date().toISOString();
  const novaChaveBackup = backupCodeUsuario.value.trim().replace(/\s+/g,'').toUpperCase();
  if(novaChaveBackup && !/^[A-F0-9]{48}$/.test(novaChaveBackup)) return alert('A chave de backup deve ter 48 caracteres hexadecimais.');
  if(novaChaveBackup) localStorage.setItem('anotaaiBackupCode',novaChaveBackup);
  else localStorage.removeItem('anotaaiBackupCode');
  save();
  alert('Configurações do usuário salvas!');
  home();
}

// ------------------------ LIMPEZA LOCAL ----------------------------
function abrirLimpeza() { const modal=document.createElement('div'); modal.id='modalLimpeza'; modal.className='modal-backdrop'; modal.innerHTML=`<div class="modal-box"><div class="toolbar"><div><h3>Limpar dados locais</h3><p class="muted">O que deseja limpar?</p></div><button class="modal-close" onclick="fecharModal('modalLimpeza')">×</button></div><div class="clear-options"><button onclick="limparDados('vendas')"><b>🛒 Vendas</b><span>Vendas, pagamentos e cobranças.</span></button><button onclick="limparDados('clientes')"><b>👥 Clientes</b><span>Somente clientes.</span></button><button onclick="limparDados('relatorios')"><b>📊 Relatórios</b><span>Dados salvos de relatórios.</span></button><button class="clear-all" onclick="limparDados('tudo')"><b>🗑 Tudo</b><span>Todos os dados locais.</span></button></div></div>`; document.body.appendChild(modal); }
async function limparDados(tipo) {
  if(!confirm('Tem certeza? Essa ação não poderá ser desfeita.'))return;
  if(tipo==='vendas'){
    db.vendas=[];db.pagamentos=[];db.cobrancas=[];db.movimentacoesEstoque=[];
  } else if(tipo==='clientes'){
    db.clientes=[];
  } else if(tipo==='relatorios'){
    localStorage.removeItem('cvrelatorios');
  } else if(tipo==='tudo'){
    const codigoBackup=localStorage.getItem('anotaaiBackupCode');
    if(codigoBackup && backupApiConfigurada()){
      try{await chamarApiBackup('delete',codigoBackup); }catch(erro){ if(!confirm('Não foi possível apagar o backup online. Deseja apagar mesmo assim apenas os dados deste aparelho?'))return; }
    }
    db=emptyDB();
    localStorage.removeItem('cvrelatorios');
    localStorage.removeItem('anotaaiBackupCode');
    localStorage.removeItem('anotaaiUltimoBackup');
    localStorage.removeItem('anotaaiUltimaSync');
    localStorage.removeItem('anotaaiBackupHorarios');
    localStorage.removeItem('anotaaiBackupsExecutados');
    localStorage.removeItem('anotaaiSyncPopupData');
    localStorage.setItem('cvdb',JSON.stringify(db));
    fecharModal('modalLimpeza');
    location.reload();
    return;
  }
  save();fecharModal('modalLimpeza');location.reload();
}

// ----------------------------- PWA --------------------------------
// Guarda o pedido de instalação enviado pelo navegador até o usuário tocar
// no botão "Instalar AnotaAí", disponível na aba Mais.
let pedidoInstalacaoPWA = null;

function appEstaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function atualizarBotaoInstalacao() {
  const botao = document.getElementById('installAppBtn');
  const status = document.getElementById('installAppStatus');
  if (!botao || !status) return;
  if (appEstaInstalado()) {
    botao.disabled = true;
    botao.classList.add('installed');
    botao.textContent = '✓ Aplicativo instalado';
    status.textContent = 'O AnotaAí já está instalado neste aparelho.';
  } else if (pedidoInstalacaoPWA) {
    botao.disabled = false;
    botao.classList.remove('installed');
    botao.textContent = '⬇ Instalar AnotaAí';
    status.textContent = 'Tudo pronto! Toque no botão para instalar.';
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pedidoInstalacaoPWA = event;
  atualizarBotaoInstalacao();
});

window.addEventListener('appinstalled', () => {
  pedidoInstalacaoPWA = null;
  atualizarBotaoInstalacao();
});

async function instalarApp() {
  if (appEstaInstalado()) return;
  if (pedidoInstalacaoPWA) {
    pedidoInstalacaoPWA.prompt();
    await pedidoInstalacaoPWA.userChoice;
    pedidoInstalacaoPWA = null;
    atualizarBotaoInstalacao();
    return;
  }

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const texto = ios
    ? 'No iPhone ou iPad, toque no botão Compartilhar do Safari e escolha “Adicionar à Tela de Início”.'
    : 'Abra este site pelo Chrome ou Edge, acesse o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. A instalação exige que o site esteja publicado com HTTPS.';
  const modal = document.createElement('div');
  modal.id = 'modalInstalacao';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<div class="modal-box"><div class="toolbar"><div><h3>📱 Instalar AnotaAí</h3><p class="muted">Adicionar à tela inicial</p></div><button class="modal-close" onclick="fecharModal('modalInstalacao')">×</button></div><p class="install-help">${texto}</p><button class="btn" onclick="fecharModal('modalInstalacao')">Entendi</button></div>`;
  document.body.appendChild(modal);
}

// O Service Worker só funciona corretamente em HTTPS ou localhost.
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));

// --------------------------- LICENÇA ------------------------------
const DEVICE_ID_KEY = 'anotaaiDeviceId';
const DEVICE_ID_COOKIE = 'anotaaiDeviceId';

function lerIdDispositivoCookie() {
  try {
    const item = document.cookie.split('; ').find(parte => parte.startsWith(DEVICE_ID_COOKIE + '='));
    return item ? decodeURIComponent(item.slice(DEVICE_ID_COOKIE.length + 1)) : '';
  } catch {
    return '';
  }
}

function salvarIdDispositivo(id) {
  try { localStorage.setItem(DEVICE_ID_KEY, id); } catch {}
  try { sessionStorage.setItem(DEVICE_ID_KEY, id); } catch {}
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${DEVICE_ID_COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=315360000; SameSite=Lax${secure}`;
  } catch {}
}

function obterIdDispositivo() {
  let id = '';
  try { id = localStorage.getItem(DEVICE_ID_KEY) || ''; } catch {}
  if (!id) id = lerIdDispositivoCookie();
  if (!id) {
    try { id = sessionStorage.getItem(DEVICE_ID_KEY) || ''; } catch {}
  }

  // Se encontramos o identificador em qualquer armazenamento, replica nos demais.
  // Assim um simples F5/reabertura não cria uma nova vaga de licença.
  if (id) {
    salvarIdDispositivo(id);
    return id;
  }

  if (window.crypto?.randomUUID) id = window.crypto.randomUUID();
  else id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  salvarIdDispositivo(id);
  return id;
}
const TOLERANCIA_OFFLINE_MS = 3 * 24 * 60 * 60 * 1000;
function licenseApiConfigurada() { const url=String(window.ANOTAAI_LICENSE_API||'').trim(); return /^https:\/\//i.test(url)&&!url.includes('SEU-DOMINIO'); }
function telaAtivacao(mensagem='') { const atual=localStorage.getItem('anotaaiLicenseCode')||''; document.querySelector('#app').innerHTML=`<header class="top"><div class="brand-wrap"><img src="logo.png" class="app-logo" alt="Logo AnotaAí"><div class="top-text"><h1>AnotaAí</h1><p>Ativação do aplicativo</p></div></div></header><main class="page activation-page"><section class="card activation-card"><div class="activation-icon">🔑</div><h2>Ative seu AnotaAí</h2><p class="muted">Digite a licença recebida na compra.</p>${mensagem?`<p class="license-message">${escapeHtml(mensagem)}</p>`:''}<div class="field"><label>Chave de licença</label><input id="licenseInput" value="${escapeHtml(atual)}" autocomplete="off" autocapitalize="characters" placeholder="ANOTA-XXXX-XXXX-XXXX-XXXX"></div><button class="btn" onclick="ativarLicenca()">Ativar e continuar</button><p class="muted activation-help">É necessário conectar à internet na primeira ativação.</p></section></main>`; }
async function consultarLicenca(code) { if(!licenseApiConfigurada())throw new Error('Configure a URL da licença no arquivo backup-config.js.'); const resposta=await fetch(window.ANOTAAI_LICENSE_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({license:code,deviceId:obterIdDispositivo()})}); let json; try{json=await resposta.json();}catch{throw new Error('Resposta inválida do servidor de licenças.');} if(!resposta.ok||!json.ok){const erro=new Error(json.error||'Licença recusada.');erro.recusa=true;throw erro;}return json; }
function mostrarSincronizacaoDiaria() {
  const hoje=chaveDataLocal();
  if(localStorage.getItem('anotaaiSyncPopupData')===hoje)return;
  localStorage.setItem('anotaaiSyncPopupData',hoje);
  const temChave=!!localStorage.getItem('anotaaiBackupCode');
  const modal=document.createElement('div');
  modal.id='modalSyncDiaria';
  modal.className='modal-backdrop';
  modal.innerHTML=`<div class="modal-box"><div class="toolbar"><div><h3>🔄 Sincronização diária</h3><p class="muted">Confira as atualizações salvas no seu backup.</p></div><button class="modal-close" onclick="fecharModal('modalSyncDiaria')">×</button></div><p>${temChave?'Deseja sincronizar agora os dados deste aparelho com o backup online?':'Configure uma chave de backup nas configurações do usuário para sincronizar os dados.'}</p>${temChave?'<button class="btn" onclick="sincronizarDiariaPeloPopup()">🔄 Sincronizar atualizações</button>':'<button class="btn" onclick="fecharModal(\'modalSyncDiaria\');configUsuario()">⚙️ Configurar chave de backup</button>'}<button class="btn secondary" onclick="fecharModal('modalSyncDiaria')">Agora não</button></div>`;
  document.body.appendChild(modal);
}
async function sincronizarDiariaPeloPopup(){
  fecharModal('modalSyncDiaria');
  await sincronizarAgora();
}
function mostrarAvisoCorrecaoSincronizacao() {
  const chaveAviso = 'anotaaiAvisoAtualizacoesV4';
  if (localStorage.getItem(chaveAviso) === '1') return false;

  // Marca como visto ao exibir para garantir que este aviso apareça uma única vez.
  localStorage.setItem(chaveAviso, '1');

  const modal = document.createElement('div');
  modal.id = 'modalAvisoAtualizacaoSync';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<div class="modal-box"><div class="toolbar"><div><h3>Atualizações no sistema ✅</h3></div><button class="modal-close" onclick="fecharModal('modalAvisoAtualizacaoSync');setTimeout(mostrarSincronizacaoDiaria,250)">×</button></div><div class="update-list"><p>✅ Cada licença agora pode ser usada em até 2 dispositivos</p><p>✅ Novo controle para liberar dispositivos pelo painel administrativo</p><p>✅ Agora é possível personalizar a mensagem de cobrança</p><p>✅ Variáveis disponíveis para PIX, recebedor e nome da loja</p></div><div class="update-footer">As novas funções já estão disponíveis nesta versão.</div><button class="btn" onclick="fecharModal('modalAvisoAtualizacaoSync');setTimeout(mostrarSincronizacaoDiaria,250)">Entendi</button></div>`;
  document.body.appendChild(modal);
  return true;
}

async function abrirAppAposLicenca(){if(localStorage.getItem('anotaaiAutoSync')!=='false'&&localStorage.getItem('anotaaiBackupCode')){const sincronizou=await sincronizarAgora(true);if(sincronizou)marcarHorariosVencidosExecutados();}iniciarAgendamentoBackups();home();setTimeout(()=>{if(!mostrarAvisoCorrecaoSincronizacao())mostrarSincronizacaoDiaria();},450);}
async function ativarLicenca() { const input=document.getElementById('licenseInput'),code=input.value.trim().toUpperCase();if(!code)return alert('Informe a chave de licença.');try{input.disabled=true;const info=await consultarLicenca(code);localStorage.setItem('anotaaiLicenseCode',code);localStorage.setItem('anotaaiLicenseCheckedAt',String(Date.now()));localStorage.setItem('anotaaiLicenseInfo',JSON.stringify(info));await abrirAppAposLicenca();}catch(erro){telaAtivacao(erro.message);} }
async function iniciarComLicenca() { if(window.ANOTAAI_LICENSE_REQUIRED!==true)return abrirAppAposLicenca();const code=localStorage.getItem('anotaaiLicenseCode');if(!code)return telaAtivacao();try{const info=await consultarLicenca(code);localStorage.setItem('anotaaiLicenseCheckedAt',String(Date.now()));localStorage.setItem('anotaaiLicenseInfo',JSON.stringify(info));await abrirAppAposLicenca();}catch(erro){const ultima=Number(localStorage.getItem('anotaaiLicenseCheckedAt')||0);if(!erro.recusa&&ultima&&Date.now()-ultima<=TOLERANCIA_OFFLINE_MS)return abrirAppAposLicenca();telaAtivacao(erro.message);} }
function trocarLicenca(){if(!confirm('Deseja remover a licença deste aparelho e informar outra? Seus dados locais não serão apagados.'))return;localStorage.removeItem('anotaaiLicenseCode');localStorage.removeItem('anotaaiLicenseCheckedAt');localStorage.removeItem('anotaaiLicenseInfo');telaAtivacao();}
iniciarComLicenca();
