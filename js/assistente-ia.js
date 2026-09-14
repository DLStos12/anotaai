// ----------------------- ASSISTENTE TÉO ---------------------------
// Chat conversacional com histórico curto e confirmação antes de gravar dados.
window.teoHistorico = window.teoHistorico || [];
window.ultimaAcaoIA = null;
window.teoArquivos = window.teoArquivos || [];

function abrirAssistenteIA() {
  shell('Conversa com o Téo', `
    <section class="teo-chat">
      <header class="teo-chat-header">
        <img class="ai-teo-avatar" src="teo-avatar.png" alt="Avatar do Téo">
        <div><h2>Téo</h2><span><i></i> Assistente do AnotaAí</span></div>
        <div class="teo-header-actions">
          <button class="teo-clear" type="button" onclick="limparConversaTeo()" title="Nova conversa">↻</button>
          <button class="teo-close" type="button" onclick="fecharAssistenteTeo()" title="Fechar conversa" aria-label="Fechar conversa">×</button>
        </div>
      </header>
      <div id="teoMensagens" class="teo-messages" aria-live="polite"></div>
      <div id="resultadoIA" class="teo-action-area"></div>
      <div id="statusIA" class="ai-status"></div>
      <div class="teo-composer">
        <textarea id="comandoIA" rows="1" maxlength="1000" placeholder="Converse com o Téo..." oninput="ajustarCampoTeo(this)" onkeydown="atalhoEnviarTeo(event)"></textarea>
        <button id="botaoEnviarIA" type="button" onclick="enviarComandoIA()" aria-label="Enviar mensagem">➤</button>
      </div>
      <p class="teo-hint">Enter para enviar · Shift + Enter para nova linha</p>
    </section>`, 'inicio');
  if (!window.teoHistorico.length) adicionarMensagemTeo('assistant', 'Oi! Sou o Téo, seu assistente. Posso conversar com você e também cadastrar produtos, registrar vendas e gerar relatórios. O que vamos fazer hoje?');
  else renderizarHistoricoTeo();
  setTimeout(() => document.querySelector('#comandoIA')?.focus(), 100);
}

function limparConversaTeo() { window.teoHistorico=[]; window.ultimaAcaoIA=null; abrirAssistenteIA(); }
function fecharAssistenteTeo() { home(); }
function ajustarCampoTeo(campo) { campo.style.height='auto'; campo.style.height=`${Math.min(campo.scrollHeight,120)}px`; }
function atalhoEnviarTeo(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviarComandoIA();} }
function adicionarMensagemTeo(role,texto,arquivo=null) { window.teoHistorico.push({role,texto:String(texto||''),arquivo}); window.teoHistorico=window.teoHistorico.slice(-20); renderizarHistoricoTeo(); }
function renderizarHistoricoTeo() {
  const el=document.querySelector('#teoMensagens'); if(!el)return;
  el.innerHTML=window.teoHistorico.map(m=>`<div class="teo-message-row ${m.role==='user'?'user':'assistant'}">${m.role==='assistant'?'<img src="teo-avatar.png" alt="">':''}<div class="teo-bubble">${escapeHtml(m.texto).replace(/\n/g,'<br>')}${m.arquivo?`<a class="teo-file" href="${m.arquivo.url}" download="${escapeHtml(m.arquivo.nome)}"><span>📄</span><div><b>${escapeHtml(m.arquivo.nome)}</b><small>Documento PDF · toque para baixar</small></div><strong>↓</strong></a>`:''}</div></div>`).join('');
  el.scrollTop=el.scrollHeight;
}
function apiIAConfigurada(){const url=String(window.ANOTAAI_AI_API||'').trim();return /^https:\/\//i.test(url)&&!url.includes('SEU-DOMINIO');}
function nomeNormalizadoIA(nome=''){return String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
function buscarClienteIA(nome){const n=nomeNormalizadoIA(nome);return db.clientes.find(c=>nomeNormalizadoIA(c.nome)===n);}
function buscarProdutoIA(nome){const n=nomeNormalizadoIA(nome);return db.produtos.find(p=>nomeNormalizadoIA(p.nome)===n);}
function contextoTeo(){return {clientes:db.clientes.slice(0,300).map(c=>({id:c.id,nome:c.nome})),produtos:db.produtos.slice(0,300).map(p=>({id:p.id,nome:p.nome,precoPrazo:Number(p.precoPrazo??p.preco??0),precoAvista:Number(p.precoAvista??p.precoPrazo??p.preco??0),controlarEstoque:Boolean(p.controlarEstoque),estoque:Number(p.estoque||0)}))};}

async function enviarComandoIA(textoOpcao='') {
  const campo=document.querySelector('#comandoIA'),botao=document.querySelector('#botaoEnviarIA'),status=document.querySelector('#statusIA'),resultado=document.querySelector('#resultadoIA');
  if(!campo||!botao||!status||!resultado)return;
  const comando=String(textoOpcao||campo.value).trim(); if(!comando)return;
  if(!apiIAConfigurada())return alert('Configure a URL da IA no backup-config.js.');
  adicionarMensagemTeo('user',comando); campo.value=''; ajustarCampoTeo(campo); resultado.innerHTML=''; botao.disabled=true;
  status.innerHTML='<div class="teo-typing"><span></span><span></span><span></span> Téo está pensando</div>';
  try {
    const historico=window.teoHistorico.slice(-12).map(m=>({role:m.role,texto:m.texto}));
    const resposta=await fetch(window.ANOTAAI_AI_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comando,historico,license:localStorage.getItem('anotaaiLicenseCode')||'',deviceId:obterIdDispositivo(),contexto:contextoTeo()})});
    const texto=await resposta.text(); let json;
    try{json=JSON.parse(texto);}catch{throw new Error(texto.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,400)||'Resposta inválida do servidor.');}
    if(!resposta.ok||!json.ok)throw new Error(json.error||'Não foi possível conversar com o Téo.');
    const plano=json.resultado; if(!plano||typeof plano!=='object')throw new Error('O Téo retornou uma resposta inválida.');
    normalizarPlanoTeo(plano);
    adicionarMensagemTeo('assistant',plano.mensagem||'Entendi.'); window.ultimaAcaoIA=plano; mostrarRespostaTeo(plano);
  }catch(erro){adicionarMensagemTeo('assistant',`Não consegui responder agora. ${erro.message}`);}
  finally{status.innerHTML='';botao.disabled=false;campo.focus();}
}

// Se a IA tentar cadastrar um produto que já existe, reaproveita o cadastro
// atual e mantém a venda, em vez de bloquear todo o plano.
function normalizarPlanoTeo(plano) {
  if(!Array.isArray(plano.acoes))return plano;
  corrigirClientesAusentesTeo(plano);
  plano.acoes.forEach(a=>{if(a.tipo==='cadastrar_produtos')a.produtos=(a.produtos||[]).filter(p=>!buscarProdutoIA(p.nome));});
  plano.acoes.forEach(a=>{if(a.tipo==='cadastrar_clientes')a.clientes=(a.clientes||[]).filter(c=>!buscarClienteIA(c.nome));});
  plano.acoes=plano.acoes.filter(a=>(a.tipo!=='cadastrar_produtos'||a.produtos.length)&&(a.tipo!=='cadastrar_clientes'||a.clientes.length));
  const nomesCadastrados=new Set(plano.acoes.filter(a=>a.tipo==='cadastrar_clientes').flatMap(a=>a.clientes||[]).map(c=>nomeNormalizadoIA(c.nome)));
  const clienteAindaAusente=plano.acoes.filter(a=>a.tipo==='registrar_vendas').flatMap(a=>a.vendas||[]).map(v=>String(v.cliente||'').trim()).find(nome=>nome&&!buscarClienteIA(nome)&&!nomesCadastrados.has(nomeNormalizadoIA(nome)));
  if(clienteAindaAusente){
    plano.estado='pergunta';
    plano.mensagem=`O cliente ${clienteAindaAusente} ainda não está cadastrado. Quer que eu o cadastre antes de registrar a venda?`;
    plano.opcoes=[{label:'Cadastrar cliente',mensagem:`Sim, cadastre o cliente ${clienteAindaAusente} e depois registre a venda.`},{label:'Cancelar venda',mensagem:'Não, cancele essa venda.'}];
    plano.acoes=[];
  }
  return plano;
}

// Corrige com segurança o caso em que a IA entendeu que deve cadastrar o cliente
// da venda, mas colocou por engano o nome do usuário ou outro nome no cadastro.
function corrigirClientesAusentesTeo(plano){
  const vendas=plano.acoes.filter(a=>a.tipo==='registrar_vendas').flatMap(a=>a.vendas||[]);
  const ausentes=[...new Set(vendas.map(v=>String(v.cliente||'').trim()).filter(nome=>nome&&!buscarClienteIA(nome)).map(nome=>nomeNormalizadoIA(nome)))];
  const nomesOriginais=new Map(vendas.map(v=>[nomeNormalizadoIA(v.cliente),String(v.cliente).trim()]));
  const cadastros=plano.acoes.filter(a=>a.tipo==='cadastrar_clientes').flatMap(a=>a.clientes||[]);
  if(ausentes.length!==1||cadastros.length!==1)return;
  const cadastro=cadastros[0],nomeCadastro=nomeNormalizadoIA(cadastro.nome);
  const clienteDoCadastroUsadoEmVenda=vendas.some(v=>nomeNormalizadoIA(v.cliente)===nomeCadastro);
  if(!clienteDoCadastroUsadoEmVenda&&!buscarClienteIA(cadastro.nome))cadastro.nome=nomesOriginais.get(ausentes[0]);
}

function mostrarRespostaTeo(plano) {
  const el=document.querySelector('#resultadoIA'); if(!el)return;
  const opcoes=Array.isArray(plano.opcoes)?plano.opcoes:[],acoes=Array.isArray(plano.acoes)?plano.acoes:[];
  if(opcoes.length){el.innerHTML=`<div class="teo-options">${opcoes.map(o=>`<button type="button" data-msg="${escapeHtml(String(o.mensagem||o.label))}" onclick="enviarOpcaoTeo(this)">${escapeHtml(o.label)}</button>`).join('')}</div>`;return;}
  if(!acoes.length||plano.estado!=='pronto'){el.innerHTML='';return;}
  const linhas=[];
  acoes.forEach(a=>{
    if(a.tipo==='cadastrar_produtos')(a.produtos||[]).forEach(p=>linhas.push(`Cadastrar <b>${escapeHtml(p.nome)}</b> · prazo ${money(p.precoPrazo)} · à vista ${money(p.precoAvista)}`));
    if(a.tipo==='cadastrar_clientes')(a.clientes||[]).forEach(c=>linhas.push(`Cadastrar cliente <b>${escapeHtml(c.nome)}</b>${c.telefone?` · ${escapeHtml(c.telefone)}`:' · sem telefone'} · ${descricaoCobrancaClienteTeo(c)}`));
    if(a.tipo==='registrar_vendas')(a.vendas||[]).forEach(v=>linhas.push(`Venda para <b>${escapeHtml(v.cliente)}</b> · ${(v.itens||[]).map(i=>`${Number(i.quantidade)}x ${escapeHtml(i.produto)}${i.personalizado?' (personalizado)':''}`).join(', ')} · ${v.pagamento==='avista'?'à vista':'a prazo'}`));
    if(a.tipo==='retirar_estoque')(a.estoque||[]).forEach(e=>linhas.push(`Retirar <b>${Number(e.quantidade)}x ${escapeHtml(e.produto)}</b> do estoque · ${escapeHtml(e.motivo||'Ajuste pelo Téo')}`));
    if(a.tipo==='gerar_relatorio')linhas.push('Gerar o relatório solicitado');
  });
  el.innerHTML=`<div class="teo-plan"><strong>Confira antes de confirmar</strong>${linhas.map(l=>`<div>✓ ${l}</div>`).join('')}<div class="teo-plan-actions"><button class="btn" onclick="confirmarAcoesIA()">Confirmar</button><button class="btn secondary" onclick="cancelarPlanoTeo()">Cancelar</button></div></div>`;
}
function enviarOpcaoTeo(botao){enviarComandoIA(botao.dataset.msg||botao.textContent);}
function cancelarPlanoTeo(){window.ultimaAcaoIA=null;const el=document.querySelector('#resultadoIA');if(el)el.innerHTML='';adicionarMensagemTeo('assistant','Tudo bem, não alterei nada. O que deseja fazer?');}
function descricaoCobrancaClienteTeo(c){if(c.cobrancaTipo==='mensal')return`cobrança mensal dia ${Number(c.diaCobrancaMensal)} às ${escapeHtml(c.horaCobrancaMensal)}`;if(c.cobrancaTipo==='unica')return`cobrança em ${escapeHtml(c.dataHoraCobranca)}`;return'sem cobrança agendada';}

function validarPlanoTeo(acoes) {
  const novos=new Set(),novosClientes=new Set();
  for(const a of acoes)if(a.tipo==='cadastrar_produtos')for(const p of (a.produtos||[])){
    const nome=String(p.nome||'').trim(),pp=Number(p.precoPrazo),pa=Number(p.precoAvista);
    if(!nome||buscarProdutoIA(nome)||novos.has(nomeNormalizadoIA(nome)))throw new Error(`O produto "${nome}" já existe ou é inválido.`);
    if(!Number.isFinite(pp)||!Number.isFinite(pa)||pp<0||pa<0)throw new Error(`Os preços de "${nome}" são inválidos.`); novos.add(nomeNormalizadoIA(nome));
  }
  for(const a of acoes)if(a.tipo==='cadastrar_clientes')for(const c of (a.clientes||[])){
    const nome=String(c.nome||'').trim(),normalizado=nomeNormalizadoIA(nome);
    if(!nome||buscarClienteIA(nome)||novosClientes.has(normalizado))throw new Error(`O cliente "${nome}" já existe ou é inválido.`);
    if(!['nenhuma','unica','mensal'].includes(c.cobrancaTipo))throw new Error(`Defina a cobrança de ${nome}.`);
    if(c.cobrancaTipo==='unica'&&Number.isNaN(new Date(c.dataHoraCobranca).getTime()))throw new Error(`A data de cobrança de ${nome} é inválida.`);
    if(c.cobrancaTipo==='mensal'&&(!Number.isInteger(Number(c.diaCobrancaMensal))||Number(c.diaCobrancaMensal)<1||Number(c.diaCobrancaMensal)>31||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.horaCobrancaMensal)))throw new Error(`O dia ou horário mensal de ${nome} é inválido.`);
    novosClientes.add(normalizado);
  }
  for(const a of acoes)if(a.tipo==='registrar_vendas')for(const v of (a.vendas||[])){
    if(!buscarClienteIA(v.cliente)&&!novosClientes.has(nomeNormalizadoIA(v.cliente)))throw new Error(`Cliente não encontrado: ${v.cliente}.`);
    if(!Array.isArray(v.itens)||!v.itens.length)throw new Error(`A venda de ${v.cliente} não possui itens.`);
    for(const i of v.itens){const q=Number(i.quantidade);if(!Number.isInteger(q)||q<=0)throw new Error(`Quantidade inválida para ${i.produto}.`);if(i.personalizado){if(!Number.isFinite(Number(i.preco))||Number(i.preco)<0)throw new Error(`Informe o preço de ${i.produto}.`);}else if(!buscarProdutoIA(i.produto)&&!novos.has(nomeNormalizadoIA(i.produto)))throw new Error(`Produto não encontrado: ${i.produto}.`);}
  }
  for(const a of acoes)if(a.tipo==='retirar_estoque')for(const e of (a.estoque||[])){
    const p=buscarProdutoIA(e.produto),q=Number(e.quantidade);
    if(!p)throw new Error(`Produto não encontrado: ${e.produto}.`);
    if(!p.controlarEstoque)throw new Error(`${p.nome} não possui controle de estoque.`);
    if(!Number.isInteger(q)||q<=0)throw new Error(`Quantidade inválida para ${p.nome}.`);
    if(!String(e.motivo||'').trim())throw new Error(`Informe o motivo da retirada de ${p.nome}.`);
  }
}

function confirmarAcoesIA() {
  const plano=window.ultimaAcaoIA,acoes=Array.isArray(plano?.acoes)?plano.acoes:[]; if(!acoes.length)return alert('Não há ações para confirmar.');
  const antes=JSON.parse(JSON.stringify(db));
  try{validarPlanoTeo(acoes);acoes.filter(a=>a.tipo==='cadastrar_clientes').forEach(executarCadastroClientesTeo);acoes.filter(a=>a.tipo==='cadastrar_produtos').forEach(executarCadastroProdutosTeo);acoes.filter(a=>a.tipo==='registrar_vendas').forEach(executarVendasTeo);acoes.filter(a=>a.tipo==='retirar_estoque').forEach(executarRetiradaEstoqueTeo);save();window.ultimaAcaoIA=null;const el=document.querySelector('#resultadoIA');if(el)el.innerHTML='';const r=acoes.find(a=>a.tipo==='gerar_relatorio');if(r)enviarRelatorioNoChatTeo(r);else adicionarMensagemTeo('assistant','Pronto! As alterações foram realizadas com sucesso.');}catch(erro){db=antes;alert(`Não foi possível concluir: ${erro.message}`);}
}

function executarCadastroClientesTeo(a){
  const agora=new Date().toISOString(),base=Date.now();
  (a.clientes||[]).forEach((c,i)=>{const mensal=c.cobrancaTipo==='mensal',unica=c.cobrancaTipo==='unica',ativa=mensal||unica;db.clientes.push({id:base+i,nome:String(c.nome).trim(),telefone:String(c.telefone||'').trim(),observacao:String(c.observacao||'').trim(),cobrancaAtiva:ativa,dataHoraCobranca:mensal?proximaCobrancaMensal(Number(c.diaCobrancaMensal),c.horaCobrancaMensal):unica?c.dataHoraCobranca:null,cobrancaRecorrente:mensal?'mensal':null,diaCobrancaMensal:mensal?Number(c.diaCobrancaMensal):null,horaCobrancaMensal:mensal?c.horaCobrancaMensal:null,atualizadoEm:agora});});
}
function executarCadastroProdutosTeo(a){const agora=new Date().toISOString(),base=Date.now();(a.produtos||[]).forEach((p,i)=>db.produtos.push({id:base+i,nome:String(p.nome).trim(),precoPrazo:Number(p.precoPrazo),precoAvista:Number(p.precoAvista),controlarEstoque:Boolean(p.controlarEstoque),estoque:Math.max(0,Number(p.estoque||0)),estoqueMinimo:Math.max(0,Number(p.estoqueMinimo||0)),atualizadoEm:agora}));}
function executarVendasTeo(a){
  const consumo=new Map(),preparadas=[],agora=new Date().toISOString(),base=Date.now()+100;
  (a.vendas||[]).forEach((v,idx)=>{const cli=buscarClienteIA(v.cliente),pagamento=v.pagamento==='avista'?'avista':'prazo';let total=0;const itens=(v.itens||[]).map(i=>{const q=Number(i.quantidade);if(i.personalizado){const preco=Number(i.preco);total+=preco*q;return{produtoId:null,personalizado:true,nome:String(i.produto),quantidade:q,preco,subtotal:preco*q};}const p=buscarProdutoIA(i.produto);if(p.controlarEstoque){const usado=(consumo.get(p.id)||0)+q;if(usado>Number(p.estoque||0))throw new Error(`Estoque insuficiente de ${p.nome}. Disponível: ${p.estoque}.`);consumo.set(p.id,usado);}const preco=precoProduto(p,pagamento);total+=preco*q;return{produtoId:p.id,personalizado:false,nome:p.nome,quantidade:q,preco,subtotal:preco*q};});preparadas.push({id:base+idx*10,clienteId:cli.id,data:agora,observacao:'Registrada pelo Téo',itens,total,pagamento,atualizadoEm:agora});});
  preparadas.forEach(v=>{ajustarEstoque(v.itens,-1,'Venda registrada pelo Téo');db.vendas.push(v);if(v.pagamento==='avista')db.pagamentos.push({id:v.id+1,clienteId:v.clienteId,valor:v.total,data:agora,forma:'avista',vendaId:v.id,atualizadoEm:agora});});
}
function executarRetiradaEstoqueTeo(a){
  (a.estoque||[]).forEach(e=>{const p=buscarProdutoIA(e.produto),q=Number(e.quantidade);if(q>Number(p.estoque||0))throw new Error(`Estoque insuficiente de ${p.nome}. Disponível: ${p.estoque}.`);ajustarEstoque([{produtoId:p.id,nome:p.nome,quantidade:q}],-1,`Retirada pelo Téo: ${String(e.motivo).trim()}`);});
}
function enviarRelatorioNoChatTeo(a){
  const arquivo=criarPdfRelatorioTeo(a.relatorio||{});
  window.teoArquivos.push(arquivo.url);
  adicionarMensagemTeo('assistant','Pronto! Preparei o relatório solicitado.',arquivo);
}

function criarPdfRelatorioTeo(dados){
  const inicio=dados.dataInicial?new Date(dados.dataInicial+'T00:00:00'):null;
  const fim=dados.dataFinal?new Date(dados.dataFinal+'T23:59:59'):null;
  const nome=String(dados.cliente||'').trim();
  const cli=nome&&nomeNormalizadoIA(nome)!==nomeNormalizadoIA('Todos os clientes')?buscarClienteIA(nome):null;
  const noPeriodo=data=>(!inicio||new Date(data)>=inicio)&&(!fim||new Date(data)<=fim);
  const vendas=db.vendas.filter(v=>noPeriodo(v.data)&&(!cli||v.clienteId==cli.id));
  const pagamentos=db.pagamentos.filter(p=>noPeriodo(p.data)&&(!cli||p.clienteId==cli.id));
  const vendido=vendas.reduce((s,v)=>s+Number(v.total||0),0),pago=pagamentos.reduce((s,p)=>s+Number(p.valor||0),0);
  const dataBr=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR'):'sem limite';
  const linhas=['ANOTAAI - RELATORIO DE VENDAS E PAGAMENTOS',`Gerado em: ${new Date().toLocaleString('pt-BR')}`,`Periodo: ${dataBr(dados.dataInicial)} ate ${dataBr(dados.dataFinal)}`,`Cliente: ${cli?cli.nome:'Todos os clientes'}`,'',`Vendido: ${money(vendido)}`,`Pago: ${money(pago)}`,`Em aberto: ${money(Math.max(0,vendido-pago))}`,'','VENDAS'];
  if(!vendas.length)linhas.push('Nenhuma venda encontrada.');
  vendas.forEach(v=>{linhas.push(`${new Date(v.data).toLocaleDateString('pt-BR')} - ${cliente(v.clienteId).nome} - ${money(v.total)} - ${(v.pagamento||'prazo')==='avista'?'A vista':'A prazo'}`);(v.itens||[]).forEach(i=>linhas.push(`  ${i.quantidade}x ${i.nome} - ${money(i.subtotal)}`));});
  linhas.push('','PAGAMENTOS');
  if(!pagamentos.length)linhas.push('Nenhum pagamento encontrado.');
  pagamentos.forEach(p=>linhas.push(`${new Date(p.data).toLocaleDateString('pt-BR')} - ${cliente(p.clienteId).nome} - ${money(p.valor)}`));
  const blob=montarPdfTextoTeo(linhas),nomeArquivo=`relatorio-anotaai-${hojeISO()}.pdf`;
  return{nome:nomeArquivo,url:URL.createObjectURL(blob)};
}

function montarPdfTextoTeo(linhas){
  const limpar=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?');
  const quebrar=(texto,max=88)=>{const palavras=limpar(texto).split(/\s+/),saida=[];let atual='';palavras.forEach(p=>{if((atual+' '+p).trim().length>max){if(atual)saida.push(atual);atual=p;}else atual=(atual+' '+p).trim();});if(atual)saida.push(atual);return saida;};
  const todas=linhas.flatMap(l=>quebrar(l)),paginas=[];for(let i=0;i<todas.length;i+=48)paginas.push(todas.slice(i,i+48));if(!paginas.length)paginas.push(['Relatorio vazio']);
  const objetos=[];objetos[1]='<< /Type /Catalog /Pages 2 0 R >>';
  const pageIds=[],contentIds=[];paginas.forEach((_,i)=>{pageIds.push(4+i*2);contentIds.push(5+i*2);});
  objetos[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${paginas.length} >>`;objetos[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  paginas.forEach((pagina,i)=>{const comandos=['BT','/F1 10 Tf','48 790 Td','13 TL'];pagina.forEach((l,j)=>{const esc=l.replace(/([\\()])/g,'\\$1');comandos.push(`${j?'T* ':''}(${esc}) Tj`);});comandos.push('ET');const stream=comandos.join('\n');objetos[pageIds[i]]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;objetos[contentIds[i]]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;});
  let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objetos.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objetos[i]}\nendobj\n`;}const xref=pdf.length;pdf+=`xref\n0 ${objetos.length}\n0000000000 65535 f \n`;for(let i=1;i<objetos.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf],{type:'application/pdf'});
}
