# 📱 AnotaAí

**Gestão simples para pequenos negócios, direto do celular.**

O **AnotaAí** é uma aplicação web desenvolvida para facilitar o controle de vendas, clientes, produtos, cobranças, pagamentos e estoque de pequenos negócios.

O projeto nasceu de um experimento de **Vibe Coding**: transformar uma ideia real em um sistema funcional utilizando **Inteligência Artificial como parceira durante o desenvolvimento**.

O que começou como uma experiência simples evoluiu para uma aplicação completa, instalável como **PWA**, com funcionamento local, sincronização online, backup em nuvem, sistema de licenciamento e painel administrativo.

> 💡 **Ideias humanas, problemas reais, muitos testes e desenvolvimento em parceria com IA.**

---

## 🤖 Desenvolvido no estilo Vibe Coding

O AnotaAí foi construído seguindo a filosofia de **Vibe Coding**.

Em vez de começar dominando toda a stack ou planejando uma arquitetura complexa, o desenvolvimento aconteceu de maneira incremental:

**Ideia → implementação com IA → teste real → bug → correção → nova necessidade → nova feature.**

A Inteligência Artificial teve participação direta na geração, análise e evolução do código, enquanto as decisões sobre funcionamento, experiência do usuário, testes, problemas encontrados e direção do produto partiram do uso prático da aplicação.

O resultado é também uma demonstração de como IA pode ser utilizada não apenas para gerar pequenos trechos de código, mas como ferramenta para **construir e evoluir um produto funcional**.

---

# 🚀 O que é o AnotaAí?

O AnotaAí foi pensado principalmente para pequenos vendedores, autônomos e pequenos negócios que precisam controlar suas vendas sem depender de sistemas complexos.

A interface segue uma abordagem **mobile-first**, permitindo utilizar praticamente todo o sistema diretamente pelo celular.

Na tela inicial é possível visualizar rapidamente:

* 💰 Total em aberto;
* 🛒 Total vendido no dia;
* 👥 Quantidade de clientes;
* 🔔 Cobranças pendentes;
* 📦 Alertas de estoque baixo.

Além disso, uma nova venda pode ser iniciada rapidamente pelo botão de acesso rápido da interface.

---

# 🛒 Gestão de vendas

O AnotaAí permite registrar e acompanhar as vendas realizadas para cada cliente.

Entre os recursos disponíveis:

* Registro de novas vendas;
* Associação da venda a um cliente;
* Seleção de produtos cadastrados;
* Inclusão de produtos personalizados diretamente na venda;
* Cálculo automático dos valores;
* Diferentes informações relacionadas ao pagamento;
* Edição de vendas já realizadas;
* Pesquisa de vendas pelo nome do cliente;
* Histórico das vendas;
* Atualização do estoque conforme as operações realizadas.

Produtos personalizados utilizados em uma venda também são preservados durante a edição.

---

# 👥 Gestão de clientes

A área de clientes centraliza as principais informações financeiras de cada pessoa cadastrada.

É possível:

* Cadastrar clientes;
* Editar dados;
* Pesquisar clientes pelo nome;
* Visualizar histórico;
* Consultar o saldo devedor individual;
* Registrar pagamentos;
* Configurar cobranças;
* Selecionar múltiplos clientes;
* Identificar clientes com valores em aberto;
* Excluir clientes preservando o histórico financeiro relacionado.

Cada cliente possui seu **saldo em aberto calculado automaticamente** com base nas vendas e pagamentos registrados.

Quando não existem pendências, o saldo é exibido como **R$ 0,00**.

---

# 💳 Pagamentos e saldo devedor

Os pagamentos recebidos podem ser registrados diretamente no perfil do cliente.

O sistema calcula automaticamente:

**Total comprado − Total pago = Saldo em aberto**

Isso permite registrar inclusive pagamentos parciais e acompanhar o valor restante.

O AnotaAí também mantém o histórico financeiro necessário para calcular corretamente os débitos de cada cliente.

---

# 💬 Cobranças pelo WhatsApp

Uma das principais propostas do AnotaAí é facilitar cobranças sem transformar o processo em algo complicado.

O sistema pode gerar automaticamente uma mensagem contendo informações como:

* Nome do cliente;
* Compras realizadas;
* Produtos;
* Quantidades;
* Valores;
* Total em aberto;
* Chave PIX;
* Nome do recebedor.

Também é possível personalizar a mensagem utilizada nas cobranças.

### 📅 Agendamento de cobranças

Cada cliente pode possuir uma data e horário programados para cobrança.

Quando o momento chega, o AnotaAí identifica automaticamente os clientes que precisam ser cobrados e exibe uma notificação.

### 📲 Fila de cobranças

Quando existem vários clientes pendentes, o sistema pode iniciar uma **fila de cobranças**.

As cobranças são apresentadas uma por uma para envio pelo WhatsApp, tornando o processo mais organizado e evitando a necessidade de procurar manualmente cada cliente.

Também é possível selecionar vários devedores e iniciar uma fila somente com os clientes escolhidos.

---

# 📦 Produtos e controle de estoque

O AnotaAí também possui gerenciamento de produtos.

É possível:

* Cadastrar produtos;
* Editar produtos;
* Definir preços;
* Controlar estoque;
* Configurar estoque mínimo;
* Registrar movimentações;
* Realizar reposições;
* Identificar produtos com estoque baixo.

Quando um produto atinge o limite configurado, o sistema pode destacá-lo nas notificações.

As vendas também atualizam as informações de estoque automaticamente.

---

# 📊 Relatórios

A área de relatórios permite analisar os dados registrados no sistema.

Os relatórios podem utilizar filtros como:

* Período;
* Cliente;
* Histórico de movimentações;
* Informações financeiras.

Também é possível **exportar relatórios em PDF**, facilitando o arquivamento ou compartilhamento das informações.

---

# 🔔 Central de notificações

O AnotaAí possui uma central de notificações que reúne situações que precisam de atenção.

Entre elas:

* 💰 Clientes que chegaram ao horário de cobrança;
* 📦 Produtos com estoque baixo.

A quantidade de notificações pendentes é exibida diretamente na interface principal.

---

# ☁️ Backup e sincronização online

Os dados continuam disponíveis localmente no aparelho, mas o AnotaAí também possui infraestrutura de **backup e sincronização online utilizando Supabase**.

O usuário recebe um código de recuperação que permite acessar seu backup.

Entre os recursos disponíveis:

* ☁️ Criar backup online;
* 🔄 Atualizar backup;
* 📥 Restaurar dados;
* 🔀 Mesclar dados locais e remotos;
* 🔄 Sincronizar manualmente;
* ⚡ Sincronização automática após alterações;
* 📤 Exportar backup para arquivo;
* 📥 Restaurar backup através de arquivo.

A restauração utiliza um processo de **mesclagem**, evitando simplesmente substituir todo o banco local pelo conteúdo remoto.

---

# ⏰ Backup automático programado

Além da sincronização após alterações, o usuário pode configurar horários específicos para os backups.

É possível escolher até:

* 1 backup diário;
* 2 backups diários;
* 3 backups diários.

Caso o aplicativo esteja fechado no horário programado, ele identifica backups pendentes quando voltar a ser utilizado.

---

# 📱 PWA — Progressive Web App

O AnotaAí pode ser instalado no celular ou computador como um aplicativo.

A aplicação utiliza recursos de **Progressive Web App**, incluindo:

* `manifest.json`;
* Service Worker;
* Cache de arquivos;
* Interface responsiva;
* Instalação pela tela inicial;
* Experiência semelhante a um aplicativo nativo.

O próprio sistema possui uma área que auxilia na instalação.

---

# 🌙 Tema claro e escuro

A interface possui suporte aos modos:

* ☀️ Claro;
* 🌙 Escuro.

A preferência é armazenada localmente e mantida nas próximas utilizações.

---

# 🔑 Sistema de licenciamento

O AnotaAí possui um sistema próprio de ativação.

Ao abrir o aplicativo pela primeira vez, o usuário deve informar uma chave no formato:

```text
ANOTA-XXXX-XXXX-XXXX-XXXX
```

A licença é validada pelo backend antes de liberar o acesso.

O sistema também possui controle de dispositivos vinculados à licença.

Atualmente uma licença pode possuir um número limitado de aparelhos registrados, impedindo que a mesma chave seja compartilhada indiscriminadamente.

A validação também considera:

* Status da licença;
* Data de vencimento;
* Identificação do dispositivo;
* Quantidade de dispositivos vinculados.

---

# 🖥️ Painel Administrativo

O projeto possui um **Painel ADM independente** para gerenciamento do sistema.

Através dele é possível:

### 🔑 Gerenciar licenças

* Criar novas licenças;
* Definir cliente;
* Definir vencimento;
* Renovar licenças;
* Suspender acesso;
* Reativar licenças;
* Visualizar códigos disponíveis;
* Consultar quantidade de dispositivos;
* Liberar dispositivos vinculados;
* Excluir licenças.

### 📢 Publicar avisos

O administrador também pode publicar mensagens diretamente para os usuários do AnotaAí.

Esses avisos podem ser utilizados para comunicar:

* Atualizações;
* Novas funcionalidades;
* Manutenções;
* Informações importantes.

O aplicativo consulta o aviso publicado e o apresenta em formato de **popup**, apenas uma vez em cada aparelho.

O aviso também pode ser desativado posteriormente pelo Painel ADM.

---

# 🛡️ Backend e segurança

Algumas operações importantes não dependem exclusivamente do JavaScript executado no navegador.

O projeto utiliza uma combinação de infraestrutura para operações como:

* Validação de licenças;
* Controle de dispositivos;
* Gerenciamento administrativo;
* Publicação de avisos;
* Backup e sincronização.

O backend de licenciamento e administração utiliza **PHP**, enquanto a infraestrutura atual de backup e sincronização utiliza **Supabase**.

Também existem verificações de origem e validações no backend para evitar que operações protegidas dependam apenas do frontend.

> ⚠️ Nenhuma chave administrativa ou `service_role` do Supabase deve ser armazenada no frontend. Somente credenciais próprias para uso público podem estar presentes no código do cliente.

---

# 💾 Armazenamento local

O AnotaAí utiliza armazenamento local para manter os dados disponíveis no dispositivo.

Entre as informações armazenadas estão:

* Clientes;
* Produtos;
* Vendas;
* Pagamentos;
* Cobranças;
* Movimentações de estoque;
* Configurações;
* Preferências;
* Informações necessárias para sincronização.

Isso permite que a aplicação continue tendo uma experiência rápida e independente de consultas constantes ao servidor.

---

# 🔄 Sincronização entre dispositivos

A combinação entre armazenamento local e backup online permite utilizar o código de recuperação para transportar e mesclar informações entre instalações do AnotaAí.

O sistema compara os registros locais e remotos para preservar as informações durante a sincronização.

As configurações do usuário, incluindo informações utilizadas nas cobranças e PIX, também fazem parte dos dados sincronizados.

---

# ⚙️ Configurações do usuário

O usuário pode configurar informações utilizadas pelo aplicativo, incluindo dados usados automaticamente nas cobranças.

Também estão disponíveis controles relacionados a:

* Backup;
* Sincronização;
* Código de recuperação;
* Instalação do aplicativo;
* Licença;
* Limpeza de dados locais.

---

# 💬 Suporte

O próprio aplicativo possui um botão **Falar com o suporte**, permitindo abrir diretamente uma conversa pelo WhatsApp quando o usuário precisar de ajuda.

---

# 🧹 Gerenciamento de dados

O AnotaAí possui opções para limpar diferentes grupos de informações locais.

Isso permite remover separadamente dados relacionados a:

* Vendas;
* Clientes;
* Relatórios;
* Todos os dados locais.

Operações envolvendo dados sincronizados possuem cuidados adicionais para evitar inconsistências entre o armazenamento local e online.

---

# 🛠️ Tecnologias utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript
* LocalStorage
* PWA
* Service Worker

### Backend

* PHP
* APIs HTTP/JSON

### Nuvem e sincronização

* Supabase
* Supabase Edge Functions

### Hospedagem

* GitHub Pages
* Hospedagem PHP para serviços administrativos e licenciamento

### Ferramentas de desenvolvimento

* Git
* GitHub
* Inteligência Artificial / Vibe Coding

---

# 🏗️ Arquitetura

De forma simplificada:

```text
                    ┌──────────────────────┐
                    │       AnotaAí        │
                    │   HTML / CSS / JS    │
                    │        PWA           │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       LocalStorage        Supabase         API PHP
        dados locais       backup/sync     licenciamento
              │                │                │
              │                │                ▼
              │                │          Painel ADM
              │                │          dispositivos
              │                │          avisos
              │                │
              └────────────────┴────────────────┘
                       Sincronização
```

A ideia é manter o aplicativo simples para o usuário, enquanto operações que precisam de infraestrutura externa são realizadas pelos serviços de backend.

---

# 🎯 Objetivo do projeto

O AnotaAí não nasceu como um projeto corporativo nem como demonstração de domínio absoluto sobre todas as tecnologias utilizadas.

Ele nasceu da vontade de **aprender construindo**.

Cada problema encontrado durante o uso virou uma oportunidade de estudar uma solução.

Cada bug encontrado por um usuário virou uma melhoria.

Cada nova necessidade ajudou a transformar o projeto.

E o que começou como:

> *“Até onde eu consigo chegar criando um aplicativo no estilo Vibe Coding?”*

acabou se transformando em um sistema com frontend, PWA, armazenamento local, sincronização em nuvem, APIs, backend, licenciamento e painel administrativo.

---

# 🧠 O que este projeto representa

Mais do que apenas o código, o AnotaAí registra um processo de aprendizado.

Ele demonstra a capacidade de:

* Identificar um problema real;
* Pensar em uma solução;
* Transformar requisitos em funcionalidades;
* Trabalhar incrementalmente;
* Testar em situações reais;
* Encontrar e corrigir bugs;
* Integrar diferentes tecnologias;
* Evoluir uma arquitetura existente;
* Utilizar Inteligência Artificial como ferramenta de desenvolvimento.

**Vibe Coding não significa apertar um botão e receber um produto pronto.**

Neste projeto, significou saber **o que construir, testar o que foi construído, perceber quando algo estava errado e continuar iterando até chegar ao comportamento esperado.**

---

# 🚧 Projeto em desenvolvimento

O AnotaAí continua evoluindo.

Novas funcionalidades, melhorias de experiência, otimizações de sincronização e recursos administrativos podem ser adicionados conforme novas necessidades aparecem.

Algumas ideias já fazem parte do roadmap, mas são mantidas separadas das funcionalidades disponíveis atualmente.

---

# 📌 Status

🟢 **Em desenvolvimento ativo**

O projeto já possui uma versão funcional e continua recebendo novas funcionalidades, correções e melhorias.

---

## Feito com ideia, testes, código e IA

O **AnotaAí** é um projeto construído no estilo **Vibe Coding**, utilizando Inteligência Artificial intensamente durante o processo de desenvolvimento.

Mas IA foi a ferramenta.

A ideia, as decisões de produto, os testes, os problemas encontrados no mundo real e a vontade de continuar melhorando são o que transformaram código gerado em um projeto de verdade.

**AnotaAí — simples para usar, feito para evoluir. 🚀**
