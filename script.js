// --- IMPORTAÇÕES DO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// --- SUAS CONFIGURAÇÕES DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAPU8Lmm8O-8MxB19iavEc8QyeY98jd79Y",
    authDomain: "controle-financeiro-cd9b4.firebaseapp.com",
    projectId: "controle-financeiro-cd9b4",
    storageBucket: "controle-financeiro-cd9b4.firebasestorage.app",
    messagingSenderId: "779141863552",
    appId: "1:779141863552:web:55f473a9534270692b2e65"
};

// --- INICIALIZANDO O BANCO DE DADOS ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colecaoTransacoes = collection(db, "transacoes");

// --- ELEMENTOS DO DOM ---
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

// --- ESTADO DA APLICAÇÃO ---
let transacoes = [];
let graficoInstancia = null;
let idEdicao = null; // Agora usamos o ID do Firebase ao invés da posição no array

const dataHoje = new Date().toISOString().split('T')[0];
inputData.value = dataHoje;
filtroMes.value = dataHoje.substring(0, 7);

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    btnTema.innerText = '☀️';
}

// --- FUNÇÕES UTILITÁRIAS ---
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, ''); 
}
function formatarData(dataString) {
    if (!dataString) return '';
    const p = dataString.split('-');
    return `${p[2]}/${p[1]}/${p[0]}`;
}

// --- ESCUTANDO A NUVEM (TEMPO REAL) ---
onSnapshot(colecaoTransacoes, (snapshot) => {
    transacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    atualizarTela();
});

// --- RENDERIZAÇÃO PRINCIPAL ---
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
        
        // Note que agora passamos o '${transacao.id}' em formato de texto (string)
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

// --- CRUD: CRIAR E ATUALIZAR NA NUVEM ---
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const tipoTransacao = document.querySelector('input[name="tipo"]:checked').value;
    let valorFinal = Math.abs(parseFloat(inputValor.value));
    if (tipoTransacao === 'despesa') valorFinal *= -1;

    const dados = {
        texto: inputTexto.value,
        categoria: inputCategoria.value,
        valor: valorFinal,
        data: inputData.value,
        pago: inputPago.checked
    };

    try {
        if (!idEdicao) {
            // Cria novo documento no banco
            await addDoc(colecaoTransacoes, dados);
        } else {
            // Atualiza documento existente
            const docRef = doc(db, "transacoes", idEdicao);
            await updateDoc(docRef, dados);
            cancelarEdicao(); 
        }

        // Limpa campos se for criação
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

// --- CRUD: MODO EDIÇÃO ---
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

// --- CRUD: DELETAR E ALTERAR STATUS NA NUVEM ---
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

// --- EVENTOS EXTRAS ---
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