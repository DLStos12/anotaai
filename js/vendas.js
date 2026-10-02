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

            <details class="custom-product-box custom-product-accordion">

                <summary>Adicionar produto personalizado <span aria-hidden="true">⌄</span></summary>
                <div class="custom-product-content">

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
            </details>


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

        const custoUnitario = Number(p.precoCusto || 0);


        itens.push({
            produtoId: p.id,
            personalizado: false,
            nome: p.nome,
            quantidade: q,
            preco: preco,
            subtotal: subtotal,
            custoUnitario,
            custoTotal: q * custoUnitario
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
            subtotal: subtotal,
            custoUnitario: 0,
            custoTotal: 0
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
        return alertaErro('Venda não registrada. Selecione o cliente.');
    }

    const {
        itens,
        total,
        erro
    } = coletarItensVenda();

    if (erro) {
        return alertaErro(`Venda não registrada. ${erro}`);
    }

    if (!itens.length) {
        return alertaErro('Venda não registrada. Adicione pelo menos um produto ou produto personalizado.');
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

    vendas();
    alertaSucesso('✅ Venda registrada.');
}

function htmlListaVendas(lista) {
  return lista.slice().reverse().map(v=>`<div class="sale-card"><div class="sale-card-main"><div><b>${escapeHtml(cliente(v.clienteId).nome)}</b><div class="muted">${dt(v.data)} · ${v.itens.map(i=>i.quantidade+'x '+escapeHtml(i.nome)).join(', ')} · <strong>${(v.pagamento||'prazo')==='avista'?'À vista':'A prazo'}</strong></div>${v.observacao?`<div class="muted">Obs.: ${escapeHtml(v.observacao)}</div>`:''}</div><span class="price">${money(v.total)}</span></div><div class="sale-card-actions"><button class="btn secondary" onclick="editarVenda(${v.id})">✏️ Editar venda</button></div></div>`).join('') || '<div class="empty">Nenhuma venda encontrada.</div>';
}

function vendas() {
  shell('Vendas', `<div class="toolbar"><h2>Vendas</h2><button class="btn" onclick="novaVenda()">+ Nova venda</button></div>
    <section class="card client-search-card"><div class="field client-search-field"><label>Buscar vendas por cliente</label><input id="buscaVendasCliente" type="search" placeholder="Digite o nome do cliente..." oninput="filtrarVendasPorCliente()"></div></section>
    <div id="listaVendas" class="list">${htmlListaVendas(db.vendas)}</div>`, 'vendas');
}

function filtrarVendasPorCliente() {
  const termo = document.querySelector('#buscaVendasCliente')?.value.trim().toLocaleLowerCase('pt-BR') || '';
  const vendasFiltradas = termo
    ? db.vendas.filter(v => cliente(v.clienteId).nome.toLocaleLowerCase('pt-BR').includes(termo))
    : db.vendas;
  const lista = document.querySelector('#listaVendas');
  if (lista) lista.innerHTML = htmlListaVendas(vendasFiltradas);
}

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

            <details class="custom-product-box custom-product-accordion">
                <summary>Adicionar produto personalizado <span aria-hidden="true">⌄</span></summary>
                <div class="custom-product-content">

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
            </details>

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
            const custoUnitario = Number(p.precoCusto || 0);

            itens.push({
                produtoId: p.id,
                nome: p.nome,
                quantidade: q,
                preco: preco,
                subtotal: subtotal,
                custoUnitario,
                custoTotal: q * custoUnitario
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
            subtotal,
            custoUnitario: 0,
            custoTotal: 0
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
