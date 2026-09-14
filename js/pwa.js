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

