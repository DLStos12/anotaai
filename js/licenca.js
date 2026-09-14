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
function telaAtivacao(mensagem='') { esconderLoader(); const atual=localStorage.getItem('anotaaiLicenseCode')||''; document.querySelector('#app').innerHTML=`<header class="top"><div class="brand-wrap"><img src="logo.png" class="app-logo" alt="Logo AnotaAí"><div class="top-text"><h1>AnotaAí</h1><p>Ativação do aplicativo</p></div></div></header><main class="page activation-page"><section class="card activation-card"><div class="activation-icon">🔑</div><h2>Ative seu AnotaAí</h2><p class="muted">Digite a licença recebida na compra.</p>${mensagem?`<p class="license-message">${escapeHtml(mensagem)}</p>`:''}<div class="field"><label>Chave de licença</label><input id="licenseInput" value="${escapeHtml(atual)}" autocomplete="off" autocapitalize="characters" placeholder="ANOTA-XXXX-XXXX-XXXX-XXXX"></div><button class="btn" onclick="ativarLicenca()">Ativar e continuar</button><p class="muted activation-help">É necessário conectar à internet na primeira ativação.</p></section></main>`; }
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
function avisoAdminApiConfigurada(){
  const url=String(window.ANOTAAI_NOTICE_API||'').trim();
  return /^https:\/\//i.test(url);
}

function continuarAposAvisoAdmin(){
  if(!mostrarAvisoCorrecaoSincronizacao())mostrarSincronizacaoDiaria();
}

async function mostrarAvisoAdmin(){
  if(!avisoAdminApiConfigurada())return false;
  try{
    const resposta=await fetch(window.ANOTAAI_NOTICE_API,{method:'GET',cache:'no-store'});
    let json;
    try{json=await resposta.json();}catch{return false;}
    const aviso=json?.notice;
    if(!resposta.ok||!json?.ok||!aviso?.id||!aviso?.message)return false;
    const chave='anotaaiAvisoAdminVisto';
    if(localStorage.getItem(chave)===String(aviso.id))return false;
    localStorage.setItem(chave,String(aviso.id));
    const modal=document.createElement('div');
    modal.id='modalAvisoAdmin';
    modal.className='modal-backdrop';
    const titulo=escapeHtml(String(aviso.title||'Aviso'));
    const mensagem=escapeHtml(String(aviso.message||'')).replace(/\n/g,'<br>');
    modal.innerHTML=`<div class="modal-box"><div class="toolbar"><div><h3>📢 ${titulo}</h3></div><button class="modal-close" onclick="fecharModal('modalAvisoAdmin');setTimeout(continuarAposAvisoAdmin,250)">×</button></div><div class="update-list"><p>${mensagem}</p></div><button class="btn" onclick="fecharModal('modalAvisoAdmin');setTimeout(continuarAposAvisoAdmin,250)">Entendi</button></div>`;
    document.body.appendChild(modal);
    return true;
  }catch{
    return false;
  }
}

function mostrarAvisoCorrecaoSincronizacao() {
  const chaveAviso = 'anotaaiAvisoAtualizacoesV5';
  if (localStorage.getItem(chaveAviso) === '1') return false;

  // Marca como visto ao exibir para garantir que este aviso apareça uma única vez.
  localStorage.setItem(chaveAviso, '1');

  const modal = document.createElement('div');
  modal.id = 'modalAvisoAtualizacaoSync';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<div class="modal-box"><div class="toolbar"><div><h3>Atualizações no sistema ✅</h3></div><button class="modal-close" onclick="fecharModal('modalAvisoAtualizacaoSync');setTimeout(mostrarSincronizacaoDiaria,250)">×</button></div><div class="update-list"><p>✅ Cada licença agora pode ser usada em até 2 dispositivos</p><p>✅ Novo controle para liberar dispositivos pelo painel administrativo</p><p>✅ Agora é possível personalizar a mensagem de cobrança</p>
  <p>✅ Variáveis disponíveis para PIX, recebedor e nome da loja</p>
  <p>✅ Barra de pesquisa na Aba vendas</p>
  <p>✅ Saldo devedor agora aparece na aba clientes</p>
  <p>✅ Cobranças recorrentes mensais com avanço automático</p>
  </div><div class="update-footer">As novas funções já estão disponíveis nesta versão.</div><button class="btn" onclick="fecharModal('modalAvisoAtualizacaoSync');setTimeout(mostrarSincronizacaoDiaria,250)">Entendi</button></div>`;
  document.body.appendChild(modal);
  return true;
}


function mostrarLoader(){const loader=document.getElementById('appLoader');if(loader)loader.classList.remove('hidden');}
function esconderLoader(){const loader=document.getElementById('appLoader');if(loader)loader.classList.add('hidden');}

async function abrirAppAposLicenca(){if(localStorage.getItem('anotaaiAutoSync')!=='false'&&localStorage.getItem('anotaaiBackupCode')){const sincronizou=await sincronizarAgora(true);if(sincronizou)marcarHorariosVencidosExecutados();}iniciarAgendamentoBackups();home();esconderLoader();setTimeout(async()=>{if(await mostrarAvisoAdmin())return;if(!mostrarAvisoCorrecaoSincronizacao())mostrarSincronizacaoDiaria();},450);}
async function ativarLicenca() { const input=document.getElementById('licenseInput'),code=input.value.trim().toUpperCase();if(!code)return alert('Informe a chave de licença.');try{input.disabled=true;mostrarLoader();const info=await consultarLicenca(code);localStorage.setItem('anotaaiLicenseCode',code);localStorage.setItem('anotaaiLicenseCheckedAt',String(Date.now()));localStorage.setItem('anotaaiLicenseInfo',JSON.stringify(info));await abrirAppAposLicenca();}catch(erro){telaAtivacao(erro.message);} }
async function iniciarComLicenca() { if(window.ANOTAAI_LICENSE_REQUIRED!==true)return abrirAppAposLicenca();const code=localStorage.getItem('anotaaiLicenseCode');if(!code)return telaAtivacao();try{const info=await consultarLicenca(code);localStorage.setItem('anotaaiLicenseCheckedAt',String(Date.now()));localStorage.setItem('anotaaiLicenseInfo',JSON.stringify(info));await abrirAppAposLicenca();}catch(erro){const ultima=Number(localStorage.getItem('anotaaiLicenseCheckedAt')||0);if(!erro.recusa&&ultima&&Date.now()-ultima<=TOLERANCIA_OFFLINE_MS)return abrirAppAposLicenca();telaAtivacao(erro.message);} }
function trocarLicenca(){if(!confirm('Deseja remover a licença deste aparelho e informar outra? Seus dados locais não serão apagados.'))return;localStorage.removeItem('anotaaiLicenseCode');localStorage.removeItem('anotaaiLicenseCheckedAt');localStorage.removeItem('anotaaiLicenseInfo');telaAtivacao();}
iniciarComLicenca();
