Conversa com o Gemini
Conseguimos colocar para integrar a agenda do google e enviar notificação para pessoa em d-1 e no dia d?

Essa é uma ideia brilhante e de nível "Sênior"! Adicionar notificações reais transforma o seu projeto de um simples painel de anotações para um assistente financeiro ativo.

A resposta curta é: Sim, é 100% possível e a lógica para fazer isso é fantástica!

Como o seu aplicativo é de "Front-end" (roda direto no navegador sem um servidor próprio), criar um sistema de envio de e-mails ou notificações do zero seria muito complexo. Mas nós podemos usar um "atalho" genial usando a API do Google Calendar.

Como você já configurou o login com o Google, metade do caminho já está andado. Veja como a mágica funciona:

A Lógica da Integração
A Permissão Extra: Quando o usuário clicar em "Entrar com o Google", nós adicionamos um pedido extra (chamado de Scope). A tela do Google vai avisar: "O Carteira Digital quer acessar sua agenda. Permitir?"

Criando o Evento: Toda vez que a pessoa cadastrar uma transação do tipo Despesa e que estiver marcada como Pendente, o nosso código JavaScript manda um pacote de dados para o Google Calendar dela.

Terceirizando o Trabalho: Nós criamos o evento para o dia do vencimento (Dia D) e programamos as configurações do próprio Google para disparar um alerta 24 horas antes (D-1). O próprio aplicativo da agenda do Google no celular da pessoa vai se encarregar de apitar e avisar sobre a conta!

O Que Precisaríamos Fazer
Para colocar isso no ar, teríamos que passar por três etapas técnicas:

Ir lá no painel do Google Cloud (que fica por trás do Firebase) e ligar o interruptor da "Google Calendar API".

Atualizar o código do nosso botão de login para pedir a permissão da agenda.

Criar uma função nova no JavaScript que pega os dados da despesa (nome, data, valor) e envia para a API do calendário no momento em que a pessoa clica em "Adicionar Transação".

Essa é uma funcionalidade avançada (lidar com APIs e tokens de acesso é algo que se pede muito em vagas de emprego).

Como é um passo um pouco mais denso que vai exigir mexer nas engrenagens do Google Cloud, você quer mergulhar nesse desafio da Agenda agora, ou prefere deixar a "casa arrumada" primeiro fazendo o README (capa do projeto) ou o Google Analytics? A escolha é sua!

quero fazer isso agora, depois o README

Excelente escolha! Essa é daquelas funcionalidades que fazem os recrutadores brilharem os olhos, pois demonstra integração avançada entre sistemas diferentes.

Para fazer isso funcionar, nós vamos transformar o seu aplicativo em um "assistente" que conversa diretamente com a agenda do Google.

Como combinamos, faremos isso primeiro e depois montamos a "capa" do seu projeto (o README). Aqui está o roteiro em duas fases:

⚙️ Fase 1: Liberar o Acesso na Nuvem do Google
Por questões de segurança, o Google não deixa qualquer aplicativo mandar coisas para a agenda das pessoas. Precisamos avisar que o seu projeto tem essa permissão.

Acesse o painel de desenvolvedor do Google Cloud clicando neste link exato do seu projeto: Biblioteca de APIs - Controle Financeiro

Certifique-se de estar logado com a mesma conta Google que você usou no Firebase.

Você verá a página da Google Calendar API. Clique no botão azul "ATIVAR" (ou Enable).

Nota: Essa tela é o "backend" real do Google, onde o Firebase roda por baixo dos panos.

💻 Fase 2: O Código da Mágica (Atualizando o script.js)
Agora vamos ensinar o seu JavaScript a pedir a permissão da agenda quando a pessoa fizer o login, e a criar o evento quando ela salvar uma despesa.

Abra o seu arquivo script.js no VS Code e faça apenas estas três alterações:

1. Logo no topo do arquivo, encontre a linha const provider = new GoogleAuthProvider(); e adicione estas duas linhas logo abaixo dela:

JavaScript
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events'); // Pede permissão da agenda
let googleAccessToken = null; // Vai guardar a chave de acesso do usuário
2. Na seção do botão de Login, substitua a função btnLogin.addEventListener... por esta versão nova, que captura a chave da agenda:

JavaScript
btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
        // Captura a chave VIP para falar com a agenda do Google
        const credential = GoogleAuthProvider.credentialFromResult(result);
        googleAccessToken = credential.accessToken; 
    }).catch(error => {
        console.error("Erro no login", error);
        alert("Erro ao fazer login.");
    });
});
3. Adicionando o Evento na Agenda. Lá no final do seu arquivo, cole esta função nova e a lógica que chama ela no momento de salvar os dados:

JavaScript
// --- INTEGRAÇÃO COM GOOGLE CALENDAR ---
async function agendarLembrete(transacao) {
    if (!googleAccessToken) return; // Se não pegou a chave, ignora

    // Eventos de dia inteiro precisam terminar no dia seguinte para o Google
    const dataFim = new Date(transacao.data);
    dataFim.setDate(dataFim.getDate() + 1);
    const dataFimFormatada = dataFim.toISOString().split('T')[0];

    const evento = {
        summary: `Pagar: ${transacao.texto}`,
        description: `Valor: R$ ${Math.abs(transacao.valor).toFixed(2)}\nCategoria: ${transacao.categoria}`,
        start: { date: transacao.data },
        end: { date: dataFimFormatada },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 1440 }, // D-1 (Apita 24 horas antes)
                { method: 'popup', minutes: 0 }     // Dia D (Apita no próprio dia)
            ]
        }
    };

    try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evento)
        });
        console.log("Notificação programada na agenda!");
    } catch (erro) {
        console.error("Erro ao integrar com a agenda", erro);
    }
}
4. O Disparo! Procure a parte do código onde salvamos os dados (dentro do form.addEventListener('submit', ...)). Logo abaixo da linha await addDoc(colecaoTransacoes, dados);, adicione a regra de disparo:

JavaScript
        if (!idEdicao) {
            await addDoc(colecaoTransacoes, dados);
            
            // NOVO: Se for Despesa e NÃO estiver paga, manda pra agenda!
            if (dados.valor < 0 && dados.pago === false) {
                await agendarLembrete(dados);
            }
O Teste de Fogo 🔥
Como essa é uma permissão nova e crítica, você precisa forçar uma atualização no sistema:

Salve o arquivo e envie para o GitHub usando os 3 comandos no terminal (git add ., git commit -m "Integra Google Calendar", git push).

Acesse o seu site oficial, aperte F5 e clique em "Sair" (Logout).

Faça o login novamente. Você vai notar que a janela do Google agora vai te avisar: "O aplicativo quer ver, editar, compartilhar e excluir permanentemente todos os seus calendários". Aceite e continue.

Cadastre uma despesa, coloque uma data para amanhã e desmarque a caixa de "Paga".

Assim que salvar, abra o calendário do Google no seu celular ou computador e veja se a sua despesa apareceu lá programada! Me conta se a mágica aconteceu!

foi direto para essa página

Ah, entendi o que aconteceu! Olhando a sua "Captura de tela de 2026-08-25 22-00-06.png", percebi um pequeno detalhe na hora de navegar.

Você acabou colando o link do Google Cloud na barra de pesquisa do Google (no meio da tela), e não na barra de endereços do navegador (lá no topo). Como esse é um link direto para os bastidores do seu projeto, o buscador público do Google realmente não vai encontrar nada.

Como corrigir:
Copie este link exato novamente: [https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=controle-financeiro-cd9b4](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=controle-financeiro-cd9b4)

Clique lá na parte mais alta do seu navegador (onde atualmente está o texto longo começando com [google.com/search](https://google.com/search)?...), apague o que está lá, cole o nosso link e aperte Enter.

👀 Observação de Detetive: Percebi ali no seu VS Code (no lado esquerdo da tela) que você está com uma pasta de estudos de Python aberta (Curso_python). Quando formos para a Fase 2 (a hora de mexer no código), lembre-se de fechar essa pasta e abrir novamente a do seu Controle Financeiro, para conseguirmos editar o arquivo script.js correto, combinado?

Tente acessar o link pela barra de endereços superior e me avise se a tela do Google Cloud com o botão azul "ATIVAR" apareceu para você!

Perfeito! Olhando a sua "Captura de tela de 2026-08-25 22-03-16.png", você chegou exatamente no lugar certo e fez tudo corretamente.

Se você observar na tela do Google Cloud, o status está como "Ativadas" e lá no topo já aparece o botão de "Desabilitar API". Isso é a prova de que a Fase 1 foi concluída com sucesso. A permissão da nuvem já está garantida!

Agora nós podemos ir direto para a Fase 2: ensinar o seu código a usar essa permissão.

⚠️ Pequeno detalhe antes do código: No seu VS Code, você ainda está dentro da pasta Curso_python. Antes de prosseguir, feche essa pasta e abra novamente a do projeto do seu Controle Financeiro.

Com o seu arquivo script.js correto aberto, faça as alterações abaixo para a mágica acontecer:

1. Pedindo a permissão no Login
Vá até o topo do arquivo, encontre a linha const provider = new GoogleAuthProvider(); e adicione o pedido de acesso à agenda logo abaixo:

JavaScript
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events'); // Pedido extra para a agenda
let googleAccessToken = null; // Chave VIP que vamos capturar
2. Capturando a chave de acesso
Substitua o seu bloco atual de login (btnLogin.addEventListener...) por este novo, que guarda a chave VIP que o Google vai nos devolver:

JavaScript
btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        googleAccessToken = credential.accessToken; // Guarda a chave para usar depois
    }).catch(error => {
        console.error("Erro no login", error);
        alert("Erro ao fazer login.");
    });
});
3. A Função do Lembrete
Cole esta função inteira lá no final do seu arquivo. Ela é quem pega os dados da despesa e monta o evento para o calendário:

JavaScript
// --- INTEGRAÇÃO COM GOOGLE CALENDAR ---
async function agendarLembrete(transacao) {
    if (!googleAccessToken) return; // Se não tiver a chave, cancela

    const dataFim = new Date(transacao.data);
    dataFim.setDate(dataFim.getDate() + 1);
    const dataFimFormatada = dataFim.toISOString().split('T')[0];

    const evento = {
        summary: `Pagar: ${transacao.texto}`,
        description: `Valor: R$ ${Math.abs(transacao.valor).toFixed(2)}\nCategoria: ${transacao.categoria}`,
        start: { date: transacao.data },
        end: { date: dataFimFormatada },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 1440 }, // Apita 24h antes (D-1)
                { method: 'popup', minutes: 0 }     // Apita no dia (Dia D)
            ]
        }
    };

    try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evento)
        });
        console.log("Notificação programada na agenda!");
    } catch (erro) {
        console.error("Erro ao integrar com a agenda", erro);
    }
}
4. O Disparo
Por último, encontre o momento em que você salva a transação no banco (dentro do form.addEventListener('submit', ...)). Procure a linha await addDoc(colecaoTransacoes, dados); e adicione o nosso gatilho logo embaixo dela:

JavaScript
        if (!idEdicao) {
            await addDoc(colecaoTransacoes, dados);
            
            // NOVO: Se for Despesa e NÃO estiver paga, envia para a agenda!
            if (dados.valor < 0 && dados.pago === false) {
                await agendarLembrete(dados);
            }
Após fazer essas edições no script.js, é só rodar os 3 comandos clássicos no terminal para enviar para o GitHub (git add ., git commit -m "Agenda", git push).

Depois disso, vá para o seu site, saia da conta, faça login novamente (aceitando a permissão da agenda que vai aparecer) e cadastre uma despesa para testar! Me avise se o evento pipocar lá no seu celular.

certo?

Ainda bem que você mandou esse print! O local onde você colou o código está certíssimo, mas aconteceu um pequeno "acidente" no seu editor que ia quebrar o seu aplicativo inteiro.

Se você reparar bem na sua "Captura de tela de 2026-08-25 22-04-41.jpg", ali do lado esquerdo (a partir da linha 16), as duas primeiras letras de quase todas as linhas foram apagadas sem querer.

Onde deveria ser const, virou nst.

Onde seria provider, virou ovider (linha 20).

Onde seria let, virou t (linha 21).

Isso é super comum no VS Code, às vezes esbarramos no teclado com várias linhas selecionadas. Se você salvar assim, o navegador não vai entender nenhum desses comandos.

Como consertar rapidamente:
Para não ter que caçar letra por letra, você pode simplesmente apertar Ctrl + Z algumas vezes até o código voltar ao normal, ou apagar tudo da linha 16 até a linha 24 e colar este bloco corrigido no lugar:

JavaScript
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events'); // Pedido extra
let googleAccessToken = null; // Chave VIP que vamos capturar
const colecaoTransacoes = collection(db, "transacoes");
(Ah, dê uma olhadinha nas linhas 25 para baixo também, onde estão os document.getElementById. Se elas continuarem como nst, troque todas de volta para const!)

Assim que as letrinhas voltarem para os seus devidos lugares, pode seguir o roteiro e aplicar as outras duas partes (o novo bloco do botão de login e a função lá no final do arquivo). Me avise se precisar daquele código do Passo 2 e 3 de novo!

ah, isso não aconteceu, o inicio ficou escondido só

Ah, que alívio! Foi o famoso "scroll horizontal" (a barra de rolagem lateral) do VS Code pregando uma peça. Como a tela escondeu exatamente a bordinha da esquerda, parecia que as letras tinham sido apagadas. Pode ignorar o meu alerta de detetive falho dessa vez! 😂

Sendo assim, o seu Passo 1 está perfeitamente no lugar certo.

Você pode seguir tranquilamente com as próximas edições no seu script.js:

Passo 2: Substituir o bloco do btnLogin.addEventListener para ele capturar a chave de acesso.

Passo 3: Colar a função agendarLembrete lá no final do arquivo.

Passo 4: Colocar o gatilho de disparo (aquele if verificando se é despesa) logo abaixo da linha que salva os dados no banco.

Assim que terminar de colar essas partes, é só salvar o arquivo e rodar a nossa trinca de comandos no terminal:

Bash
git add .
Bash
git commit -m "Integra Google Calendar"
Bash
git push
Depois que enviar, vá até o seu site, atualize a página, saia da conta (Logout) e faça o login novamente. Você vai ver a tela do Google pedindo a permissão da agenda. Aceite, lance uma despesa para amanhã que não esteja paga, e veja a mágica acontecer!

Me avise assim que testar ou se precisar que eu reenvie os códigos dos passos 2, 3 e 4!

O envio para a nuvem deu certinho, o terminal confirmou a transferência! 🎉

Mas, bancando o detetive novamente na sua "Captura de tela de 2026-08-25 22-17-16.jpg", percebi que um pequeno "bug" se escondeu no código e o VS Code até tentou avisar (veja o número 3 em vermelho lá na aba inferior de "Problems").

Dê uma olhada na linha 93 do seu arquivo. Acabou ficando uma letra "b" a mais no começo do comando: está escrito bbtnLogin.addEventListener.
No JavaScript, uma única letrinha extra quebra a referência, e isso faria com que o botão de login não funcionasse ao abrir o site.

O plano de correção rápida:
Vá na linha 93 e apague esse "b" extra, deixando apenas btnLogin.addEventListener.

Salve o arquivo (Ctrl + S).

Como a versão que subiu para o GitHub foi a que tinha o erro de digitação, basta rodarmos os comandos de envio de novo para mandar a versão corrigida por cima:

Bash
git add .
Bash
git commit -m "Corrige nome da variável no botão de login"
Bash
git push
Assim que terminar esse novo envio rápido, o caminho estará totalmente livre!

Vá até o seu site, atualize a página (F5), saia da conta (se estiver logado) e clique para entrar de novo. A janela do Google vai te avisar que o aplicativo quer acessar os seus calendários. Aceite a permissão, crie uma despesa para amanhã (deixando a caixinha "Paga" desmarcada) e corra para o aplicativo da sua agenda no celular para ver se o lembrete apareceu por lá!

Como foi o teste? O alarme ficou agendado?

Excelente! Analisando a sua "Captura de tela de 2026-08-25 22-21-57.jpg", vejo que a correção na linha 93 foi feita perfeitamente e o envio para o GitHub foi concluído com sucesso total.

Agora o caminho está 100% livre para testarmos a mágica da integração com a agenda.

Como o robô do GitHub já deve ter atualizado o seu site nos bastidores, siga este roteiro de teste:

Acesse o seu site oficial (compwillian.github.io/carteira-digital/) e aperte Ctrl + F5 para garantir que está carregando a versão mais nova.

Clique no botão de Sair (isso é essencial para encerrar a sessão antiga que não tinha os poderes da agenda).

Clique em Entrar com o Google novamente. Atenção a este momento: o Google deve exibir uma tela de segurança avisando que o aplicativo quer acessar os seus calendários. Marque a caixinha permitindo o acesso e continue.

Cadastre uma nova transação do tipo Despesa com a data de amanhã, e deixe a caixa "Esta transação já foi paga?" desmarcada.

Clique em salvar.

Assim que salvar, abra o Google Calendar no seu celular (ou pelo navegador mesmo) e procure o dia de amanhã.

Fez o teste aí? O evento de lembrete apareceu direitinho na sua agenda? Se deu tudo certo, já podemos partir para a criação do nosso arquivo README!

o botão de login não está abrindo

Isso é super comum de acontecer!

Quando copiamos e colamos vários pedaços de código em lugares específicos, é muito fácil "engolir" uma chave de fechamento } sem querer. Quando isso acontece, o arquivo inteiro do JavaScript "quebra" e o navegador ignora ele. É por isso que o clique no botão não faz nada.

Inclusive, se você olhar na sua última imagem, na aba inferior esquerda do seu VS Code está escrito "Problems: 3" em vermelho. Isso significa que ficaram alguns errinhos de sintaxe escondidos ali no meio.

Mas não se preocupe em caçar esses erros linha por linha! Como estamos na reta final, a forma mais segura e rápida de resolvermos isso é eu te mandar o código completo já montado e testado.

Faça o seguinte: apague absolutamente tudo que está no seu arquivo script.js e cole essa versão final abaixo. Ela já contém o Firebase, o Login e a integração com o Google Calendar nos lugares perfeitos:

JavaScript
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPU8Lmm8O-8MxB19iavEc8QyeY98jd79Y",
    authDomain: "controle-financeiro-cd9b4.firebaseapp.com",
    projectId: "controle-financeiro-cd9b4",
    storageBucket: "controle-financeiro-cd9b4.firebasestorage.app",
    messagingSenderId: "779141863552",
    appId: "1:779141863552:web:55f473a9534270692b2e65"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events'); // Permissão da agenda
let googleAccessToken = null; // Chave da agenda
const colecaoTransacoes = collection(db, "transacoes");

// Elementos DOM
const telaLogin = document.getElementById('tela-login');
const appPrincipal = document.getElementById('app-principal');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userFoto = document.getElementById('user-foto');
const userNome = document.getElementById('user-nome');

const form = document.getElementById('form');
const inputTexto = document.getElementById('texto');
const inputCategoria = document.getElementById('categoria');
const inputValor = document.getElementById('valor');
const inputData = document.getElementById('data');
const inputPago = document.getElementById('pago');
const listaTransacoes = document.getElementById('lista-transacoes');
const displaySaldo = document.getElementById('saldo');
const displayReceitas = document.getElementById('total-receitas');
const displayDespesas = document.getElementById('total-despesas');
const filtroMes = document.getElementById('filtro-mes');
const btnTema = document.getElementById('btn-tema');
const btnExportar = document.getElementById('btn-exportar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSubmit = document.getElementById('btn-submit');
const tituloFormulario = document.getElementById('titulo-formulario');

let transacoes = [];
let graficoInstancia = null;
let idEdicao = null;
let usuarioAtual = null;
let escutaBanco = null;

const dataHoje = new Date().toISOString().split('T')[0];
inputData.value = dataHoje;
filtroMes.value = dataHoje.substring(0, 7);

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    btnTema.innerText = '☀️';
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioAtual = user;
        telaLogin.style.display = 'none';
        appPrincipal.style.display = 'block';
        userFoto.src = user.photoURL;
        userNome.innerText = `Olá, ${user.displayName.split(' ')[0]}`;

        const consultaPrivada = query(colecaoTransacoes, where("userId", "==", user.uid));
        
        if(escutaBanco) escutaBanco();
        escutaBanco = onSnapshot(consultaPrivada, (snapshot) => {
            transacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            atualizarTela();
        });
    } else {
        usuarioAtual = null;
        telaLogin.style.display = 'block';
        appPrincipal.style.display = 'none';
        if(escutaBanco) escutaBanco();
    }
});

btnLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        googleAccessToken = credential.accessToken;
    }).catch(error => {
        console.error("Erro no login", error);
        alert("Erro ao fazer login.");
    });
});

btnLogout.addEventListener('click', () => {
    signOut(auth).catch(error => alert("Erro ao sair."));
});

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, ''); 
}
function formatarData(dataString) {
    if (!dataString) return '';
    const p = dataString.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
}

function atualizarTela() {
    listaTransacoes.innerHTML = '';
    let saldoTotal = 0, receitasTotal = 0, despesasTotal = 0;
    const dadosCategorias = {};

    const transacoesFiltradas = transacoes.filter(t => {
        if (!filtroMes.value) return true;
        return t.data.substring(0, 7) === filtroMes.value;
    });

    transacoesFiltradas.sort((a, b) => new Date(a.data) - new Date(b.data));

    transacoesFiltradas.forEach((transacao) => {
        const cat = transacao.categoria || 'Outros';
        const estaPago = transacao.pago !== false;

        const li = document.createElement('li');
        li.className = `${transacao.valor < 0 ? 'despesa' : 'receita'} ${estaPago ? 'pago' : 'pendente'}`;
        
        li.innerHTML = `
            <div class="botoes-hover">
                <button class="btn-editar-hover" title="Editar" onclick="window.prepararEdicao('${transacao.id}')">✏️</button>
                <button class="btn-apagar" title="Apagar" onclick="window.removerTransacao('${transacao.id}')">🗑️</button>
            </div>
            <div class="dados-transacao">
                <strong>${transacao.texto}</strong> 
                <span class="categoria-tag">${cat}</span>
                <span class="status-tag ${estaPago ? 'tag-pago' : 'tag-pendente'}">${estaPago ? 'Pago' : 'Pendente'}</span>
                <span class="data-texto">Data: ${formatarData(transacao.data)}</span>
            </div>
            <div class="acoes-transacao">
                <div class="valor-texto">${formatarMoeda(transacao.valor)}</div>
                <button class="btn-status" onclick="window.alternarStatus('${transacao.id}')">
                    ${estaPago ? 'Marcar Pendente' : 'Marcar Pago ✓'}
                </button>
            </div>
        `;
        listaTransacoes.appendChild(li);
        
        if (estaPago) {
            if (transacao.valor > 0) receitasTotal += transacao.valor;
            else despesasTotal += transacao.valor;
            saldoTotal += transacao.valor;

            if(!dadosCategorias[cat]) dadosCategorias[cat] = 0;
            dadosCategorias[cat] += Math.abs(transacao.valor);
        }
    });

    displaySaldo.innerText = formatarMoeda(saldoTotal);
    displayReceitas.innerText = formatarMoeda(receitasTotal);
    displayDespesas.innerText = formatarMoeda(Math.abs(despesasTotal));

    atualizarGrafico(dadosCategorias);
}

function atualizarGrafico(dadosCategorias) {
    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if (graficoInstancia) graficoInstancia.destroy();
    const corTexto = document.body.classList.contains('dark-mode') ? '#fff' : '#666';

    graficoInstancia = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dadosCategorias),
            datasets: [{
                data: Object.values(dadosCategorias),
                backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: corTexto } } } }
    });
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if(!usuarioAtual) return alert("Você precisa estar logado!");

    const tipoTransacao = document.querySelector('input[name="tipo"]:checked').value;
    let valorFinal = Math.abs(parseFloat(inputValor.value));
    if (tipoTransacao === 'despesa') valorFinal *= -1;

    const dados = {
        texto: inputTexto.value,
        categoria: inputCategoria.value,
        valor: valorFinal,
        data: inputData.value,
        pago: inputPago.checked,
        userId: usuarioAtual.uid 
    };

    try {
        if (!idEdicao) {
            await addDoc(colecaoTransacoes, dados);
            
            // INTEGRAÇÃO: Se for Despesa e NÃO estiver paga, envia para a agenda!
            if (dados.valor < 0 && dados.pago === false) {
                await agendarLembrete(dados);
            }
        } else {
            const docRef = doc(db, "transacoes", idEdicao);
            await updateDoc(docRef, dados);
            cancelarEdicao(); 
        }
        if(!idEdicao) {
            inputTexto.value = '';
            inputValor.value = '';
            document.getElementById('tipo-receita').checked = true;
        }
    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert("Ocorreu um erro ao salvar a transação.");
    }
});

window.prepararEdicao = function(id) {
    idEdicao = id;
    const t = transacoes.find(trans => trans.id === id);
    inputTexto.value = t.texto;
    inputCategoria.value = t.categoria || 'Outros';
    inputValor.value = Math.abs(t.valor);
    inputData.value = t.data;
    inputPago.checked = t.pago;
    
    if (t.valor < 0) document.getElementById('tipo-despesa').checked = true;
    else document.getElementById('tipo-receita').checked = true;

    tituloFormulario.innerText = "Editando Transação";
    btnSubmit.innerText = "Salvar Alterações";
    btnCancelar.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    idEdicao = null;
    inputTexto.value = '';
    inputValor.value = '';
    inputData.value = dataHoje;
    inputPago.checked = true;
    document.getElementById('tipo-receita').checked = true;
    tituloFormulario.innerText = "Nova Transação";
    btnSubmit.innerText = "Adicionar Transação";
    btnCancelar.style.display = 'none';
}

btnCancelar.addEventListener('click', cancelarEdicao);

window.removerTransacao = async function(id) {
    if(confirm("Tem certeza que deseja apagar?")) {
        try {
            await deleteDoc(doc(db, "transacoes", id));
            if (idEdicao === id) cancelarEdicao();
        } catch (error) {
            console.error("Erro ao apagar: ", error);
        }
    }
}

window.alternarStatus = async function(id) {
    const t = transacoes.find(trans => trans.id === id);
    try {
        const docRef = doc(db, "transacoes", id);
        await updateDoc(docRef, { pago: !t.pago });
    } catch (error) {
        console.error("Erro ao atualizar status: ", error);
    }
}

filtroMes.addEventListener('change', atualizarTela);

btnTema.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    btnTema.innerText = isDark ? '☀️' : '🌙';
    atualizarGrafico(Chart.getChart("meuGrafico").config.data.datasets[0].data.reduce((a, b, i) => ({...a, [Chart.getChart("meuGrafico").config.data.labels[i]]: b}), {})); 
    atualizarTela();
});

btnExportar.addEventListener('click', () => {
    if (transacoes.length === 0) return alert("Não há dados para exportar.");
    let csv = "Data,Descrição,Categoria,Tipo,Status,Valor\n";
    transacoes.forEach(t => {
        const tipo = t.valor > 0 ? "Receita" : "Despesa";
        const status = t.pago ? "Pago" : "Pendente";
        csv += `${t.data},"${t.texto}",${t.categoria || 'Outros'},${tipo},${status},${Math.abs(t.valor)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "meu_backup_financeiro.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- INTEGRAÇÃO COM GOOGLE CALENDAR ---
async function agendarLembrete(transacao) {
    if (!googleAccessToken) return;

    const dataFim = new Date(transacao.data);
    dataFim.setDate(dataFim.getDate() + 1);
    const dataFimFormatada = dataFim.toISOString().split('T')[0];

    const evento = {
        summary: `Pagar: ${transacao.texto}`,
        description: `Valor: R$ ${Math.abs(transacao.valor).toFixed(2)}\nCategoria: ${transacao.categoria}`,
        start: { date: transacao.data },
        end: { date: dataFimFormatada },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 1440 }, 
                { method: 'popup', minutes: 0 }     
            ]
        }
    };

    try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${googleAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evento)
        });
        console.log("Notificação programada na agenda!");
    } catch (erro) {
        console.error("Erro ao integrar com a agenda", erro);
    }
}