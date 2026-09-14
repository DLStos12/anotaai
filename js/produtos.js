// --------------------------- PRODUTOS ------------------------------
function produtos() {
    shell('Produtos', `
        <div class="toolbar">
            <h2>Produtos</h2>
            <button class="btn" onclick="formProduto()">+ Novo produto</button>
        </div>

        <div class="list">
            ${db.produtos.map(p => `
                <div class="item product-card">
                    <div>
                        <b>${escapeHtml(p.nome)}</b>

                        <div class="price">
                            A prazo: ${money(p.precoPrazo ?? p.preco)}
                        </div>

                        <div class="price">
                            À vista: ${money(p.precoAvista ?? p.precoPrazo ?? p.preco)}
                        </div>

                        ${p.controlarEstoque
                            ? `<div class="muted">Estoque: ${p.estoque} · mínimo: ${p.estoqueMinimo}</div>`
                            : '<div class="muted">Estoque não controlado</div>'
                        }
                    </div>

                    <div class="product-actions">
                        ${p.controlarEstoque
                            ? `<button class="btn secondary" onclick="reporEstoque(${p.id})">+ Estoque</button>`
                            : ''
                        }

                        <button class="btn secondary" onclick="formProduto(${p.id})">
                            Editar
                        </button>

                        <button class="btn danger" onclick="excluirProduto(${p.id})">
                            🗑 Excluir
                        </button>
                    </div>
                </div>
            `).join('') || '<div class="empty">Nenhum produto cadastrado.</div>'}
        </div>
    `, 'mais');
}

function formProduto(id) {
    const p = db.produtos.find(x => x.id == id) || {
        nome: '',
        precoPrazo: '',
        precoAvista: '',
        controlarEstoque: false,
        estoque: 0,
        estoqueMinimo: 0
    };

    const precoPrazo = p.precoPrazo ?? p.preco ?? '';
    const precoAvista = p.precoAvista ?? p.precoPrazo ?? p.preco ?? '';

    shell(id ? 'Editar produto' : 'Cadastrar produto', `
        <section class="card">

            <div class="field">
                <label>Produto *</label>
                <input id="pnome" value="${escapeHtml(p.nome)}">
            </div>

            <div class="field">
                <label>Preço a prazo *</label>
                <input
                    id="pprecoPrazo"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${precoPrazo}"
                >
            </div>

            <div class="field">
                <label>Preço à vista *</label>
                <input
                    id="pprecoAvista"
                    type="number"
                    step="0.01"
                    min="0"
                    value="${precoAvista}"
                >
            </div>

            <label class="checkline">
                <input
                    id="pcontrola"
                    type="checkbox"
                    ${p.controlarEstoque ? 'checked' : ''}
                >
                Controlar estoque
            </label>

            <div class="row">

                <div class="field">
                    <label>Estoque atual</label>
                    <input
                        id="pestoque"
                        type="number"
                        min="0"
                        value="${p.estoque || 0}"
                    >
                </div>

                <div class="field">
                    <label>Estoque mínimo</label>
                    <input
                        id="pmin"
                        type="number"
                        min="0"
                        value="${p.estoqueMinimo || 0}"
                    >
                </div>

            </div>

            <button
                class="btn"
                onclick="salvarProduto(${id || 'null'})"
            >
                Salvar produto
            </button>

        </section>
    `, 'mais');
}

function salvarProduto(id) {

    const nome = pnome.value.trim();

    const precoPrazo = Number(pprecoPrazo.value);
    const precoAvista = Number(pprecoAvista.value);

    const controlarEstoque = pcontrola.checked;

    const estoque = Number(pestoque.value || 0);
    const estoqueMinimo = Number(pmin.value || 0);

    const atualizadoEm = new Date().toISOString();

    if (
        !nome ||
        precoPrazo < 0 ||
        precoAvista < 0
    ) {
        return alert('Preencha os dados.');
    }

    if (id) {

        const produtoAtual = db.produtos.find(p => p.id == id);

        Object.assign(produtoAtual, {
            nome,
            precoPrazo,
            precoAvista,
            controlarEstoque,
            estoque,
            estoqueMinimo,
            atualizadoEm
        });

    } else {

        db.produtos.push({
            id: Date.now(),
            nome,
            precoPrazo,
            precoAvista,
            controlarEstoque,
            estoque,
            estoqueMinimo,
            atualizadoEm
        });

    }

    save();
    produtos();
}

function excluirProduto(id) {
    const p = db.produtos.find(x => x.id == id);

    if (!p) return;

    const possuiVendas = db.vendas.some(v =>
        v.itens?.some(i => i.produtoId == id)
    );

    let mensagem = `Tem certeza que deseja excluir o produto "${p.nome}"?`;

    if (possuiVendas) {
        mensagem +=
            '\n\nEsse produto já aparece em vendas registradas. ' +
            'Ele será removido apenas do cadastro atual, ' +
            'mas continuará aparecendo no histórico dessas vendas.';
    }

    if (!confirm(mensagem)) return;

    // Registra a exclusão para o sistema de sincronização
    registrarExclusao('produtos', id);

    // Remove somente do cadastro de produtos
    db.produtos = db.produtos.filter(x => x.id != id);

    save();

    produtos();
}

function precoProduto(produto, pagamento) {

    if (pagamento === 'avista') {
        return Number(
            produto.precoAvista ??
            produto.precoPrazo ??
            produto.preco ??
            0
        );
    }

    return Number(
        produto.precoPrazo ??
        produto.preco ??
        0
    );
}

function ajustarEstoque(itens, sinal, motivo) {

    itens.forEach(i => {

        // Produto personalizado não possui estoque
        if (i.personalizado || !i.produtoId) {
            return;
        }

        const p = produto(i.produtoId);

        if (!p || !p.controlarEstoque) {
            return;
        }

        const agora =
            new Date().toISOString();

        p.estoque =
            Number(p.estoque || 0) +
            (sinal * i.quantidade);

        p.atualizadoEm = agora;

        db.movimentacoesEstoque.push({
            id: Date.now() + Math.random(),
            produtoId: p.id,
            tipo: sinal > 0 ? 'entrada' : 'saida',
            quantidade: i.quantidade,
            data: agora,
            motivo,
            atualizadoEm: agora
        });

    });
}

