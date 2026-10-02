// ----------------------------- MAIS -------------------------------
function cardPlanoAtual(){const p=planoAtual();if(p==='pro')return`<section class="card plan-card premium"><div><span class="plan-label">PLANO PRÓ</span><h3>Todos os recursos liberados</h3><p class="muted">Acesso ${escapeHtml(validadePremium())} · tudo ilimitado.</p></div><button class="btn premium-button" onclick="abrirOfertaPremium()">Estender plano</button></section>`;if(p==='basic')return`<section class="card plan-card premium"><div><span class="plan-label">PLANO BÁSICO</span><h3>Seu negócio organizado</h3><p class="muted">Acesso ${escapeHtml(validadePremium())} · 50 clientes, 10 produtos e 5 relatórios/mês.</p></div><button class="btn premium-button" onclick="abrirOfertaPremium()">Estender ou mudar plano</button></section>`;return`<section class="card plan-card"><div><span class="plan-label">PLANO FREE</span><h3>Conheça os planos do AnotaAí</h3><p class="muted">Até 10 clientes, 5 produtos e 1 relatório por mês.</p></div><button class="btn premium-button" onclick="abrirOfertaPremium()">Planos a partir de R$ 10</button></section>`;}
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
  ${cardPlanoAtual()}
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
const BACKUP_LISTAS = ['clientes','produtos','vendas','pagamentos','gastos','movimentacoesEstoque','cobrancas'];
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
    versao: 27,
    criadoEm: new Date().toISOString(),
    dados: JSON.parse(JSON.stringify(db))
  };
}

async function chamarApiBackup(action, code, data) {
  if (!backupApiConfigurada()) throw new Error('Configure a URL da API no arquivo backup-config.js antes de publicar.');

  const publishableKey = String(window.ANOTAAI_SUPABASE_KEY || '').trim();
  if (!publishableKey) throw new Error('Configure a Publishable Key do Supabase no arquivo backup-config.js.');

  const resposta = await fetch(window.ANOTAAI_BACKUP_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': publishableKey
    },
    body: JSON.stringify({
      action,
      code,
      data,
      license: localStorage.getItem('anotaaiLicenseCode') || '',
      deviceId: obterIdDispositivo()
    })
  });

  let json;
  try { json = await resposta.json(); }
  catch { throw new Error('O servidor de backup respondeu em um formato inválido.'); }

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
