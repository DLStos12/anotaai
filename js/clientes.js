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
  shell('Clientes', `<div class="toolbar"><h2>Clientes</h2><div class="client-toolbar-actions"><button class="btn secondary" onclick="sincronizarContatosCelular()">📱 Importar contatos</button><button class="btn" onclick="formCliente()">+ Novo cliente</button></div></div>
    <section class="card client-search-card"><div class="field client-search-field"><label>Buscar cliente</label><input id="buscaClientes" type="search" placeholder="Digite o nome do cliente..." oninput="filtrarListaClientes()"></div><label class="checkline"><input id="selecionarDevedores" type="checkbox" onchange="selecionarTodosDevedores(this.checked)"> Selecionar todos com saldo em aberto</label></section>
    <div id="bulkBar" class="bulk-bar hidden"><b><span id="bulkCount">0</span> selecionado(s)</b><div><button class="btn whatsapp-btn" onclick="cobrarSelecionados()">💬 Cobrar</button> <button class="btn danger" onclick="excluirSelecionados()">🗑 Excluir</button></div></div>
    <div id="listaClientesCadastro" class="list">${htmlListaClientes(db.clientes)}</div>`, 'mais');
}

async function sincronizarContatosCelular(){
  if(!navigator.contacts?.select){
    alert('A seleção de contatos não está disponível neste navegador. No Android, abra o AnotaAí pelo Google Chrome e tente novamente.');
    return;
  }
  try{
    const contatos=await navigator.contacts.select(['name','tel'],{multiple:true});
    if(!contatos?.length)return;
    const normalizarTelefone=v=>String(v||'').replace(/\D/g,'');
    const nomesExistentes=new Set(db.clientes.map(c=>c.nome.trim().toLocaleLowerCase('pt-BR')));
    const telefonesExistentes=new Set(db.clientes.map(c=>normalizarTelefone(c.telefone)).filter(Boolean));
    const novos=[];
    contatos.forEach((contato,i)=>{
      const nome=String(contato.name?.[0]||'').trim();
      const telefone=normalizarTelefone(contato.tel?.[0]);
      const nomeKey=nome.toLocaleLowerCase('pt-BR');
      if(!nome||nomesExistentes.has(nomeKey)||(telefone&&telefonesExistentes.has(telefone)))return;
      nomesExistentes.add(nomeKey);if(telefone)telefonesExistentes.add(telefone);
      novos.push({id:Date.now()+i,nome,telefone,observacao:'Importado dos contatos',cobrancaAtiva:false,dataHoraCobranca:null,cobrancaRecorrente:null,diaCobrancaMensal:null,horaCobrancaMensal:null,atualizadoEm:new Date().toISOString()});
    });
    if(!novos.length)return alert('Os contatos selecionados já estavam cadastrados.');
    const vagas=Math.max(0,limiteClientesPlano()-db.clientes.length);if(!vagas)return alertaPremium(`O plano ${nomePlano()} atingiu o limite de clientes.`);const importar=novos.slice(0,vagas);db.clientes.push(...importar);save();alertaSucesso(`✅ ${importar.length} contato(s) importado(s) com sucesso.${importar.length<novos.length?' Alguns contatos não foram importados por causa do limite do plano.':''}`);clientes();
  }catch(erro){if(erro?.name!=='AbortError')alert('Não foi possível acessar os contatos. Verifique a permissão do navegador.');}
}
function htmlListaClientes(lista) {
  return lista.map(c=>`<div class="client-card"><div class="client-head"><label class="client-select"><input class="cliente-check" type="checkbox" value="${c.id}" onchange="atualizarBulk()"></label><div class="client-info"><b>${escapeHtml(c.nome)}</b><div class="client-balance">Saldo devedor: <strong>${money(saldoCliente(c.id))}</strong></div><div class="client-observation">${c.observacao?`📝 ${escapeHtml(c.observacao)}`:'<span class="muted">Sem observação</span>'}</div><div class="muted">${escapeHtml(c.telefone||'Sem telefone')} ${c.cobrancaAtiva?`· cobrança ${formatarCobranca(c)}`:''}</div><div>${statusCliente(c)}</div></div><button class="btn secondary" onclick="formCliente(${c.id})">Editar</button></div><div class="client-actions"><button class="btn payment-btn" onclick="registrarPagamento(${c.id})">💰 Receber valor</button><button class="btn payment-btn" onclick="quitarSaldoCliente(${c.id})" ${saldoCliente(c.id)<=0?'disabled':''}>✅ Quitar saldo</button><button class="btn whatsapp-btn" onclick="enviarMensagem(${c.id})">💬 Enviar mensagem</button><button class="btn danger" onclick="excluirCliente(${c.id})">🗑 Excluir</button></div></div>`).join('') || '<div class="empty">Nenhum cliente encontrado.</div>';
}
function filtrarListaClientes() { const termo=document.querySelector('#buscaClientes').value.trim().toLowerCase(); document.querySelector('#listaClientesCadastro').innerHTML=htmlListaClientes(db.clientes.filter(c=>c.nome.toLowerCase().includes(termo))); atualizarBulk(); }
function selecionados() { return [...document.querySelectorAll('.cliente-check:checked')].map(x=>Number(x.value)); }
function atualizarBulk() { const n=selecionados().length, bar=document.querySelector('#bulkBar'); if(!bar)return; bar.classList.toggle('hidden',!n); document.querySelector('#bulkCount').textContent=n; }
function selecionarTodosDevedores(on) { document.querySelectorAll('.cliente-check').forEach(ch=>ch.checked=on && saldoCliente(Number(ch.value))>0); atualizarBulk(); }
function cobrarSelecionados() { if(!planoPremium())return exigirPremium('A fila de cobranças');const ids=selecionados().filter(id=>saldoCliente(id)>0); if(!ids.length)return alert('Selecione clientes com saldo em aberto.'); iniciarFilaCobranca(ids); }
function registrarExclusao(tipo,id){db.exclusoes||=[];db.exclusoes=db.exclusoes.filter(x=>!(x.tipo===tipo&&String(x.id)===String(id)));db.exclusoes.push({tipo,id,excluidoEm:new Date().toISOString()});}
function excluirSelecionados() { const ids=selecionados(); if(!ids.length)return; if(!confirm(`Excluir ${ids.length} cliente(s)? O histórico financeiro será preservado.`))return; ids.forEach(id=>registrarExclusao('clientes',id)); db.clientes=db.clientes.filter(c=>!ids.includes(c.id)); save(); clientes(); }
function excluirCliente(id) { const c=db.clientes.find(x=>x.id==id); if(!c)return; if(!confirm(`Tem certeza que deseja excluir o cliente ${c.nome}?\n\nO histórico financeiro será preservado.`))return; registrarExclusao('clientes',id); db.clientes=db.clientes.filter(x=>x.id!=id); save(); clientes(); }

function formCliente(id, nomeInicial = '') {
  if (!id && db.clientes.length >= limiteClientesPlano()) return alertaPremium(`O plano ${nomePlano()} permite até ${limiteClientesPlano()} clientes. Escolha um plano superior para cadastrar mais.`);
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

      <label class="checkline">
        <input id="crecorrente" type="checkbox" ${c.cobrancaRecorrente === 'mensal' ? 'checked' : ''} onchange="atualizarCamposCobranca()">
        Repetir a cobrança todo mês
      </label>

      <div id="camposCobrancaMensal" ${c.cobrancaRecorrente === 'mensal' ? '' : 'hidden'}>
        <div class="field">
          <label>Dia do mês</label>
          <input id="cdiamensal" type="number" min="1" max="31" value="${Number(c.diaCobrancaMensal || 1)}">
        </div>
        <div class="field">
          <label>Horário</label>
          <input id="choramensal" type="time" value="${escapeHtml(c.horaCobrancaMensal || '09:00')}">
        </div>
        <p class="muted">Nos meses mais curtos, o dia 29, 30 ou 31 será ajustado para o último dia do mês.</p>
      </div>

      <div id="campoCobrancaUnica" class="field" ${c.cobrancaRecorrente === 'mensal' ? 'hidden' : ''}>
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

function atualizarCamposCobranca() {
  const mensal = document.getElementById('crecorrente')?.checked;
  document.getElementById('camposCobrancaMensal')?.toggleAttribute('hidden', !mensal);
  document.getElementById('campoCobrancaUnica')?.toggleAttribute('hidden', mensal);
}

function salvarCliente(id) {
    const editando = Boolean(id);
    if (!id && db.clientes.length >= limiteClientesPlano()) return alertaPremium(`O plano ${nomePlano()} permite até ${limiteClientesPlano()} clientes. Escolha um plano superior para cadastrar mais.`);
    const nome = cnome.value.trim();
    const recorrenteMensal = crecorrente.checked;
    const diaMensal = Math.min(31, Math.max(1, Number(cdiamensal.value) || 1));
    const horaMensal = choramensal.value || '09:00';
    const dataHora = recorrenteMensal ? proximaCobrancaMensal(diaMensal, horaMensal) : cdatahora.value;
    const atualizadoEm = new Date().toISOString();

    if (!nome) {
        return alertaErro('Cliente não registrado. Informe o nome.');
    }

    if (ccobranca.checked && !dataHora) {
        return alertaErro('Cliente não registrado. Informe a data e a hora da cobrança.');
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
        return alertaErro(
            `Cliente não registrado. Já existe um cliente cadastrado com o nome "${clienteDuplicado.nome}".`
        );
    }

    const dados = {
        nome,
        telefone: ctel.value.trim(),
        observacao: cobs.value.trim(),
        cobrancaAtiva: ccobranca.checked,
        dataHoraCobranca: ccobranca.checked ? dataHora : null,
        cobrancaRecorrente: ccobranca.checked && recorrenteMensal ? 'mensal' : null,
        diaCobrancaMensal: recorrenteMensal ? diaMensal : null,
        horaCobrancaMensal: recorrenteMensal ? horaMensal : null,
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
    alertaSucesso(editando ? '✅ Cliente atualizado.' : '✅ Cliente criado.');
}

// ------------------------- PAGAMENTOS ------------------------------
function registrarPagamento(id) { const c=cliente(id); shell('Registrar pagamento', `<section class="card"><h2>${escapeHtml(c.nome)}</h2><p class="muted">Saldo atual</p><h2 class="balance-highlight">${money(saldoCliente(id))}</h2><div class="field"><label>Valor pago *</label><input id="pagvalor" type="number" min="0.01" step="0.01" placeholder="0,00"></div><div class="field"><label>Observação</label><textarea id="pagobs" placeholder="Ex.: Pix, pagamento parcial..."></textarea></div><button class="btn" onclick="salvarPagamento(${id})">Confirmar pagamento</button></section>`, 'mais'); }
function salvarPagamento(id) { const valor=Number(pagvalor.value),agora=new Date().toISOString(); if(!valor||valor<=0)return alert('Informe um valor válido.'); if(valor>saldoCliente(id)&&!confirm('O valor é maior que o saldo atual. Registrar mesmo assim?'))return; db.pagamentos.push({id:Date.now(),clienteId:id,valor,data:agora,observacao:pagobs.value.trim(),atualizadoEm:agora}); save(); alert('Pagamento registrado!'); clientes(); }
function quitarSaldoCliente(id) {
  const c = cliente(id);
  const valor = saldoCliente(id);

  if (valor <= 0) return alert(`${c.nome} não possui saldo em aberto.`);
  if (!confirm(`Confirmar a quitação total de ${money(valor)} de ${c.nome}?`)) return;

  const agora = new Date().toISOString();
  db.pagamentos.push({
    id: Date.now(),
    clienteId: id,
    valor,
    data: agora,
    observacao: 'Quitação total do saldo',
    atualizadoEm: agora
  });

  save();
  alert('Saldo quitado com sucesso!');
  clientes();
}

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
    const agora = new Date();
    db.cobrancas.push({
      id: Date.now(),
      clienteId: id,
      data: agora.toISOString(),
      valor: saldoCliente(id),
      vencimento: c.dataHoraCobranca || null,
      atualizadoEm: agora.toISOString()
    });
    if (c.cobrancaRecorrente === 'mensal' && vencimento && !Number.isNaN(vencimento.getTime()) && vencimento <= agora) {
      c.dataHoraCobranca = proximaCobrancaMensal(c.diaCobrancaMensal, c.horaCobrancaMensal, agora);
      c.atualizadoEm = agora.toISOString();
    }
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
  if (!planoPremium()) return exigirPremium('A fila de cobranças');
  const ids = clientesParaCobrarHoje().map(c => c.id);
  if (!ids.length) return alert('Nenhuma cobrança pendente para iniciar.');
  iniciarFilaCobranca(ids);
}
function iniciarFilaCobranca(ids) {
  if (!planoPremium()) return exigirPremium('A fila de cobranças');
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
