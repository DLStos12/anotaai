# Mapa dos arquivos JavaScript

Os arquivos são carregados pelo `index.html` na ordem indicada abaixo. Como o
AnotaAí ainda usa funções globais e atributos `onclick`, essa ordem deve ser
mantida.

| Arquivo | Modifique quando precisar alterar |
| --- | --- |
| `core.js` | Tema, banco local (`cvdb`), `save()`, cálculos de saldo, datas e notificações |
| `interface.js` | Estrutura visual geral, menu, cabeçalho, tela inicial e modal de notificações |
| `clientes.js` | Clientes, pagamentos, cobranças, WhatsApp e fila de cobrança |
| `produtos.js` | Cadastro de produtos, preços, estoque, reposição e exclusão |
| `vendas.js` | Nova venda, produtos personalizados, cálculo, salvamento e edição de vendas |
| `financeiro.js` | Painel mensal de vendas, recebimentos, gastos e resultado |
| `assistente-ia.js` | Chat do Téo, histórico da conversa, perguntas, prévias e execução de múltiplas ações |
| `relatorios.js` | Filtros, geração de relatório e exportação em PDF |
| `configuracoes.js` | Tela Mais, backup, sincronização, agenda, usuário e limpeza de dados |
| `pwa.js` | Instalação do aplicativo e registro do Service Worker |
| `licenca.js` | Identificação do dispositivo, ativação, validação da licença e avisos administrativos |

## Regra importante

Não coloque novamente todas as funções em um único arquivo. Antes de criar uma
função nova, escolha o arquivo cuja responsabilidade mais combina com ela. Se a
função for usada por várias áreas, coloque-a em `core.js`.
