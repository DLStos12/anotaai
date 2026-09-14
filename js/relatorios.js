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


