/* AnotaAí - Painel financeiro mensal ----------------------------- */
let financeiroMesAtual = new Date().toISOString().slice(0, 7);
const CATEGORIAS_GASTO = ['Estoque/mercadoria','Transporte','Alimentação','Contas','Manutenção','Divulgação','Outros'];

function mesFinanceiroData(mes=financeiroMesAtual) { const [ano,numeroMes]=String(mes).split('-').map(Number);return new Date(ano,numeroMes-1,1); }
function nomeMesFinanceiro(mes=financeiroMesAtual) { const texto=mesFinanceiroData(mes).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return texto.charAt(0).toUpperCase()+texto.slice(1); }
function alterarMesFinanceiro(delta) { const data=mesFinanceiroData();data.setMonth(data.getMonth()+Number(delta||0));financeiroMesAtual=`${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}`;financeiro(); }
function selecionarMesFinanceiro(valor) { if(/^\d{4}-\d{2}$/.test(valor||''))financeiroMesAtual=valor;financeiro(); }
function dentroDoMes(data,mes=financeiroMesAtual) { return String(data||'').slice(0,7)===mes; }
function gastoNoMes(gasto,mes=financeiroMesAtual) { const inicio=String(gasto.data||'').slice(0,7);return gasto.recorrente?inicio<=mes:inicio===mes; }
function custoItemVendido(item) { if(item.personalizado)return 0;if(Number.isFinite(Number(item.custoTotal)))return Number(item.custoTotal);const cadastro=db.produtos.find(p=>p.id==item.produtoId);return Number(item.quantidade||0)*Number(cadastro?.precoCusto||0); }

function resumoFinanceiro(mes=financeiroMesAtual) {
  const vendasMes=db.vendas.filter(v=>dentroDoMes(v.data,mes));
  const pagamentosMes=db.pagamentos.filter(p=>dentroDoMes(p.data,mes));
  const gastosMes=db.gastos.filter(g=>gastoNoMes(g,mes));
  const vendas=vendasMes.reduce((s,v)=>s+Number(v.total||0),0);
  const ganhos=pagamentosMes.reduce((s,p)=>s+Number(p.valor||0),0);
  const despesas=gastosMes.reduce((s,g)=>s+Number(g.valor||0),0);
  const custoProdutos=vendasMes.reduce((s,v)=>s+(v.itens||[]).reduce((total,item)=>total+custoItemVendido(item),0),0);
  const gastos=despesas+custoProdutos;
  return {vendas,ganhos,despesas,custoProdutos,gastos,resultado:ganhos-gastos,receber:totalAberto(),gastosMes,vendasMes};
}

function financeiro() {
  if (planoAtual()==='free') return alertaPremium('O Financeiro está disponível a partir do plano Básico.');
  const r=resumoFinanceiro(),maior=Math.max(r.ganhos,r.gastos,1);
  const larguraGanhos=Math.round((r.ganhos/maior)*100),larguraGastos=Math.round((r.gastos/maior)*100);
  const gastosOrdenados=r.gastosMes.slice().sort((a,b)=>new Date(b.data)-new Date(a.data));
  shell('Financeiro',`
    <div class="toolbar finance-title"><div><h2>Financeiro</h2><p class="muted">Acompanhe o movimento do seu negócio.</p></div><div class="finance-title-actions">${planoPro()?'<button class="btn secondary" onclick="exportarFinanceiroPDF()">📄 Exportar PDF</button>':'<button class="btn secondary" onclick="exigirPro(\'O PDF financeiro\')">🔒 PDF no Pró</button>'}<button class="btn" onclick="formGasto()">+ Registrar gasto</button></div></div>
    <section class="card finance-month-card"><button type="button" onclick="alterarMesFinanceiro(-1)" aria-label="Mês anterior">‹</button><div><strong>${escapeHtml(nomeMesFinanceiro())}</strong><input type="month" value="${financeiroMesAtual}" onchange="selecionarMesFinanceiro(this.value)" aria-label="Selecionar mês"></div><button type="button" onclick="alterarMesFinanceiro(1)" aria-label="Próximo mês">›</button></section>
    <section class="finance-summary">
      <div class="finance-card sales"><span>Vendas do mês</span><strong>${money(r.vendas)}</strong><small>À vista e a prazo</small></div>
      <div class="finance-card income"><span>Ganhos recebidos</span><strong>${money(r.ganhos)}</strong><small>Dinheiro que entrou</small></div>
      <div class="finance-card expense"><span>Despesas cadastradas</span><strong>${money(r.despesas)}</strong><small>Gastos informados</small></div>
      <div class="finance-card cost"><span>Custo dos produtos</span><strong>${money(r.custoProdutos)}</strong><small>Custos do que foi vendido</small></div>
      <div class="finance-card total-expense"><span>Despesas totais</span><strong>${money(r.gastos)}</strong><small>Gastos + custo dos produtos</small></div>
      <div class="finance-card result ${r.resultado<0?'negative':'positive'}"><span>Resultado do mês</span><strong>${money(r.resultado)}</strong><small>Ganhos menos gastos</small></div>
      <div class="finance-card receivable"><span>Total a receber</span><strong>${money(r.receber)}</strong><small>Saldo em aberto dos clientes</small></div>
    </section>
    <section class="card finance-chart-card"><h3>Ganhos × gastos</h3><div class="finance-bar-row"><span>Ganhos</span><div><i class="income" style="width:${larguraGanhos}%"></i></div><b>${money(r.ganhos)}</b></div><div class="finance-bar-row"><span>Gastos</span><div><i class="expense" style="width:${larguraGastos}%"></i></div><b>${money(r.gastos)}</b></div></section>
    <section class="card"><div class="toolbar"><div><h3>Gastos de ${escapeHtml(nomeMesFinanceiro())}</h3><p class="muted">Gastos recorrentes aparecem automaticamente nos meses seguintes.</p></div></div><div class="finance-expense-list">${gastosOrdenados.map(g=>`
      <div class="finance-expense-item"><div class="finance-expense-icon">${iconeCategoriaGasto(g.categoria)}</div><div class="finance-expense-info"><b>${escapeHtml(g.descricao)}</b><span>${escapeHtml(g.categoria||'Outros')} · ${new Date(`${g.data}T12:00:00`).toLocaleDateString('pt-BR')}${g.recorrente?' · recorrente':''}</span>${g.observacao?`<small>${escapeHtml(g.observacao)}</small>`:''}</div><strong>${money(g.valor)}</strong><div class="finance-expense-actions"><button class="btn secondary" onclick="formGasto(${g.id})">Editar</button><button class="btn danger" onclick="excluirGasto(${g.id})">Excluir</button></div></div>`).join('')||'<div class="empty">Nenhum gasto cadastrado neste mês.</div>'}</div></section>
  `,'financeiro');
}

function iconeCategoriaGasto(categoria) { return ({'Estoque/mercadoria':'📦','Transporte':'🚗','Alimentação':'🍽️','Contas':'🧾','Manutenção':'🛠️','Divulgação':'📣','Outros':'💸'})[categoria]||'💸'; }

function formGasto(id=null) {
  const hoje=new Date(),ultimoDia=new Date(Number(financeiroMesAtual.slice(0,4)),Number(financeiroMesAtual.slice(5,7)),0).getDate();
  const dataPadrao=`${financeiroMesAtual}-${String(Math.min(hoje.getDate(),ultimoDia)).padStart(2,'0')}`;
  const gasto=db.gastos.find(g=>g.id==id)||{descricao:'',valor:'',categoria:'Estoque/mercadoria',data:dataPadrao,formaPagamento:'Pix',recorrente:false,observacao:''};
  const modal=document.createElement('div');modal.id='modalGasto';modal.className='modal-backdrop';
  modal.innerHTML=`<div class="modal-box finance-expense-modal"><div class="toolbar"><div><h3>${id?'Editar gasto':'Registrar gasto'}</h3><p class="muted">Informe a despesa do seu negócio.</p></div><button class="modal-close" onclick="fecharModal('modalGasto')">×</button></div>
    <div class="field"><label>Descrição *</label><input id="gastoDescricao" value="${escapeHtml(gasto.descricao)}" placeholder="Ex.: Compra de mercadorias"></div>
    <div class="row"><div class="field"><label>Valor *</label><input id="gastoValor" type="number" min="0.01" step="0.01" value="${gasto.valor}" placeholder="0,00"></div><div class="field"><label>Data *</label><input id="gastoData" type="date" value="${escapeHtml(gasto.data)}"></div></div>
    <div class="row"><div class="field"><label>Categoria</label><select id="gastoCategoria">${CATEGORIAS_GASTO.map(c=>`<option ${gasto.categoria===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select></div><div class="field"><label>Pagamento</label><select id="gastoForma">${['Pix','Dinheiro','Cartão','Boleto','Outro'].map(f=>`<option ${gasto.formaPagamento===f?'selected':''}>${f}</option>`).join('')}</select></div></div>
    <label class="checkline"><input id="gastoRecorrente" type="checkbox" ${gasto.recorrente?'checked':''}> Repetir este gasto todo mês</label>
    <div class="field"><label>Observação</label><textarea id="gastoObservacao" placeholder="Opcional">${escapeHtml(gasto.observacao||'')}</textarea></div>
    <button class="btn finance-save-expense" onclick="salvarGasto(${id||'null'})">${id?'Salvar alterações':'Registrar gasto'}</button></div>`;
  document.body.appendChild(modal);
}

function dataGastoValida(valor) { return /^\d{4}-\d{2}-\d{2}$/.test(valor||'')&&!Number.isNaN(new Date(`${valor}T12:00:00`).getTime()); }
function salvarGasto(id) {
  const descricao=document.getElementById('gastoDescricao').value.trim(),valor=Number(document.getElementById('gastoValor').value),data=document.getElementById('gastoData').value;
  if(!descricao)return alertaErro('Gasto não registrado. Informe uma descrição.');
  if(!Number.isFinite(valor)||valor<=0)return alertaErro('Gasto não registrado. Informe um valor válido.');
  if(!dataGastoValida(data))return alertaErro('Gasto não registrado. Informe uma data válida.');
  const dados={descricao,valor,data,categoria:document.getElementById('gastoCategoria').value,formaPagamento:document.getElementById('gastoForma').value,recorrente:document.getElementById('gastoRecorrente').checked,observacao:document.getElementById('gastoObservacao').value.trim(),atualizadoEm:new Date().toISOString()};
  if(id)Object.assign(db.gastos.find(g=>g.id==id),dados);else db.gastos.push({id:Date.now(),...dados});
  financeiroMesAtual=data.slice(0,7);save();fecharModal('modalGasto');financeiro();alertaSucesso(id?'✅ Gasto atualizado.':'✅ Gasto registrado.');
}

function excluirGasto(id) {
  const gasto=db.gastos.find(g=>g.id==id);if(!gasto)return;
  confirmarAcaoApp({titulo:'Excluir gasto?',mensagem:`Tem certeza que deseja excluir “${gasto.descricao}” no valor de ${money(gasto.valor)}?`,textoConfirmar:'Excluir gasto',aoConfirmar:()=>{registrarExclusao('gastos',id);db.gastos=db.gastos.filter(g=>g.id!=id);save();financeiro();alertaSucesso('✅ Gasto excluído.');}});
}

function linhasCustosFinanceiro(vendas) {
  const grupos = {};
  vendas.forEach(v => (v.itens || []).forEach(item => {
    if (item.personalizado) return;
    const chave = String(item.produtoId ?? item.nome);
    const atual = grupos[chave] || (grupos[chave] = {nome:item.nome, quantidade:0, custo:0});
    atual.quantidade += Number(item.quantidade || 0);
    atual.custo += custoItemVendido(item);
  }));
  return Object.values(grupos).sort((a,b)=>b.custo-a.custo);
}

function exportarFinanceiroPDF() {
  if (!planoPro()) return exigirPro('O PDF financeiro');
  const r = resumoFinanceiro();
  const custos = linhasCustosFinanceiro(r.vendasMes);
  const gastos = r.gastosMes.slice().sort((a,b)=>new Date(a.data)-new Date(b.data));
  const janela = window.open('', '_blank');
  if (!janela) return alertaErro('O navegador bloqueou a janela do PDF. Permita pop-ups para o AnotaAí e tente novamente.');
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Financeiro - ${escapeHtml(nomeMesFinanceiro())}</title><style>
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#172033;margin:0;font-size:12px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0b2855;padding-bottom:12px;margin-bottom:18px}h1{margin:0;color:#0b2855;font-size:24px}h2{margin:22px 0 8px;color:#0b2855;font-size:16px}.meta{color:#667085;margin-top:5px}.resumo{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.card{border:1px solid #dfe5ec;border-radius:8px;padding:10px}.card span,.card strong,.card small{display:block}.card span,.card small{color:#667085}.card strong{font-size:16px;margin:5px 0}.positivo{color:#087d49}.negativo{color:#c63043}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe5ec;padding:7px;text-align:left}th{background:#f3f6f9;color:#0b2855}.total{font-weight:bold;background:#f7f9fb}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><header><div><h1>AnotaAí</h1><div class="meta">Relatório financeiro · ${escapeHtml(nomeMesFinanceiro())}</div></div><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')}</div></header>
  <div class="resumo"><div class="card"><span>Vendas</span><strong>${money(r.vendas)}</strong><small>À vista e a prazo</small></div><div class="card"><span>Ganhos recebidos</span><strong class="positivo">${money(r.ganhos)}</strong><small>Dinheiro que entrou</small></div><div class="card"><span>Despesas cadastradas</span><strong>${money(r.despesas)}</strong></div><div class="card"><span>Custo dos produtos</span><strong>${money(r.custoProdutos)}</strong></div><div class="card"><span>Despesas totais</span><strong>${money(r.gastos)}</strong></div><div class="card"><span>Resultado</span><strong class="${r.resultado<0?'negativo':'positivo'}">${money(r.resultado)}</strong><small>Ganhos − despesas totais</small></div></div>
  <h2>Custos dos produtos vendidos</h2><table><thead><tr><th>Produto</th><th>Quantidade</th><th>Custo total</th></tr></thead><tbody>${custos.map(c=>`<tr><td>${escapeHtml(c.nome)}</td><td>${c.quantidade}</td><td>${money(c.custo)}</td></tr>`).join('')||'<tr><td colspan="3">Nenhum produto com custo registrado.</td></tr>'}<tr class="total"><td colspan="2">Total</td><td>${money(r.custoProdutos)}</td></tr></tbody></table>
  <h2>Gastos cadastrados</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>${gastos.map(g=>`<tr><td>${new Date(`${g.data}T12:00:00`).toLocaleDateString('pt-BR')}</td><td>${escapeHtml(g.descricao)}${g.recorrente?' (recorrente)':''}</td><td>${escapeHtml(g.categoria||'Outros')}</td><td>${money(g.valor)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhum gasto cadastrado.</td></tr>'}<tr class="total"><td colspan="3">Total</td><td>${money(r.despesas)}</td></tr></tbody></table>
  <script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  janela.document.close();
}
