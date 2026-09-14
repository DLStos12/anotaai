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
