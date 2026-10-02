/* ================================================================
   AnotaAí - Núcleo do front-end
   ----------------------------------------------------------------
   Inicializa tema, banco local e utilidades compartilhadas.
   Os demais recursos estão organizados nos outros arquivos desta pasta.
   Consulte js/README.md antes de adicionar uma nova função.
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
  clientes: [], produtos: [], vendas: [], pagamentos: [], gastos: [],
  movimentacoesEstoque: [], cobrancas: [],
  config: { usuarioNome: '', pixChave: '', pixNome: '', incluirPix: true, personalizarCobranca: false, mensagemCobranca: '', atualizadoEm: '' }
});
let db;
try { db = JSON.parse(localStorage.getItem('cvdb')) || emptyDB(); }
catch { db = emptyDB(); }
// Compatibilidade com versões antigas do projeto.
db.clientes ||= []; db.produtos ||= []; db.vendas ||= []; db.pagamentos ||= []; db.gastos ||= [];
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

// Substitui os avisos nativos do navegador por um modal integrado ao app.
const filaAlertasApp = [];
let alertaAppAberto = false;
function mostrarAlertaApp(mensagem, titulo='Atenção', tipo='aviso', acaoPremium=false) {
  filaAlertasApp.push({mensagem:String(mensagem ?? ''), titulo:String(titulo || 'Atenção'), tipo, acaoPremium});
  abrirProximoAlertaApp();
}
function abrirProximoAlertaApp() {
  if (alertaAppAberto || !filaAlertasApp.length) return;
  alertaAppAberto = true;
  const aviso = filaAlertasApp.shift();
  const modal = document.createElement('div');
  modal.id = 'modalAlertaApp';
  modal.className = 'app-alert-backdrop';
  const icones = {sucesso:'✅', erro:'❌', aviso:'!', premium:'★'};
  const botoes = aviso.acaoPremium
    ? `<div class="app-alert-actions"><button type="button" class="btn secondary" onclick="fecharAlertaApp()">Fechar</button><button type="button" class="btn premium-button" onclick="abrirPremiumPeloAlerta()">Conhecer os planos</button></div>`
    : `<button type="button" class="btn" onclick="fecharAlertaApp()">Entendi</button>`;
  modal.innerHTML = `<div class="app-alert-box ${aviso.tipo}" role="alertdialog" aria-modal="true" aria-labelledby="appAlertTitle"><div class="app-alert-icon">${icones[aviso.tipo] || '!'}</div><h3 id="appAlertTitle">${escapeHtml(aviso.titulo)}</h3><p>${escapeHtml(aviso.mensagem).replace(/\n/g,'<br>')}</p>${botoes}</div>`;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.querySelector('button').focus();
}
function fecharAlertaApp() {
  const modal = document.getElementById('modalAlertaApp');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.remove();
    alertaAppAberto = false;
    abrirProximoAlertaApp();
  }, 180);
}
function alertaSucesso(mensagem, titulo='Tudo certo!') { mostrarAlertaApp(mensagem, titulo, 'sucesso'); }
function alertaErro(mensagem, titulo='Não foi possível concluir') { mostrarAlertaApp(mensagem, titulo, 'erro'); }
function alertaAviso(mensagem, titulo='Atenção') { mostrarAlertaApp(mensagem, titulo, 'aviso'); }
function alertaPremium(mensagem) { mostrarAlertaApp(mensagem, 'Recurso de plano pago', 'premium', true); }
function abrirPremiumPeloAlerta() { fecharAlertaApp(); setTimeout(() => abrirOfertaPremium(), 220); }
let acaoConfirmacaoApp = null;
function confirmarAcaoApp({titulo='Confirmar ação', mensagem='', textoConfirmar='Confirmar', tipo='perigo', aoConfirmar}) {
  fecharModal('modalConfirmacaoApp');
  acaoConfirmacaoApp = typeof aoConfirmar === 'function' ? aoConfirmar : null;
  const modal = document.createElement('div');
  modal.id = 'modalConfirmacaoApp';
  modal.className = 'app-alert-backdrop open';
  modal.innerHTML = `<div class="app-alert-box confirmacao ${tipo}" role="dialog" aria-modal="true" aria-labelledby="confirmacaoAppTitulo"><div class="app-alert-icon">${tipo === 'perigo' ? '🗑' : '!'}</div><h3 id="confirmacaoAppTitulo">${escapeHtml(titulo)}</h3><p>${escapeHtml(mensagem).replace(/\n/g,'<br>')}</p><div class="app-alert-actions"><button type="button" class="btn secondary" onclick="fecharConfirmacaoApp()">Cancelar</button><button type="button" class="btn danger" onclick="executarConfirmacaoApp()">${escapeHtml(textoConfirmar)}</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector('.secondary').focus();
}
function fecharConfirmacaoApp() { document.getElementById('modalConfirmacaoApp')?.remove(); acaoConfirmacaoApp = null; }
function executarConfirmacaoApp() { const acao = acaoConfirmacaoApp; document.getElementById('modalConfirmacaoApp')?.remove(); acaoConfirmacaoApp = null; acao?.(); }
window.alert = mensagem => {
  const texto = String(mensagem ?? '');
  if (/sucesso|registrad[oa]|salv[oa]|copiad[oa]|restaurad[oa]|concluída/i.test(texto)) return alertaSucesso(texto);
  alertaErro(texto);
};

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
  const proxima = new Date(c.dataHoraCobranca).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  if (c.cobrancaRecorrente === 'mensal') return `todo dia ${Number(c.diaCobrancaMensal || 1)} às ${c.horaCobrancaMensal || '09:00'} · próxima ${proxima}`;
  return proxima;
}

function dataHoraLocal(data) {
  const pad = valor => String(valor).padStart(2, '0');
  return `${data.getFullYear()}-${pad(data.getMonth()+1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

function proximaCobrancaMensal(dia=1, hora='09:00', referencia=new Date()) {
  const diaValido = Math.min(31, Math.max(1, Number(dia) || 1));
  const [horas, minutos] = String(hora || '09:00').split(':').map(Number);
  let ano = referencia.getFullYear(), mes = referencia.getMonth();
  const montar = () => {
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    return new Date(ano, mes, Math.min(diaValido, ultimoDia), Number.isFinite(horas)?horas:9, Number.isFinite(minutos)?minutos:0, 0, 0);
  };
  let proxima = montar();
  if (proxima <= referencia) {
    mes++;
    if (mes > 11) { mes = 0; ano++; }
    proxima = montar();
  }
  return dataHoraLocal(proxima);
}

function produtosEstoqueBaixo() {
  return db.produtos.filter(p => p.controlarEstoque && Number(p.estoque) <= Number(p.estoqueMinimo || 0));
}
function notificacoesCount() { return clientesParaCobrarHoje().length + produtosEstoqueBaixo().length; }
