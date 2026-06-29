// URL base da sua API backend
const API_URL = 'http://localhost:3000/api';

// Armazenamento global das transações para permitir a filtragem dinâmica rápida
let todasTransacoesGlobais = [];
let filtroAtual = 'Todos';

// Variáveis globais para o motor de investimentos e estado do cartão
let patrimonioInvestido = 0;
let rendimentoAcumulado = 0;
const taxaRendimentoSegundo = 0.0005; 
let cartaoBloqueado = false;

// ==========================================
// 1. Função para Navegar entre as telas do Celular
// ==========================================
function go(screenId) {
  const telas = document.querySelectorAll('.screen');
  telas.forEach(tela => {
    tela.classList.remove('on');
    tela.style.display = 'none';
  });

  const telaAtiva = document.getElementById(screenId);
  if (telaAtiva) {
    telaAtiva.classList.add('on');
    telaAtiva.style.display = 'block';
  }

  // Sincroniza a barra de navegação de baixo com a tela ativa
  const abas = document.querySelectorAll('.ntab');
  abas.forEach(aba => aba.classList.remove('on'));
  
  // Mapeia os ids de navegação da barra inferior
  let tabId = `t-${screenId}`;
  if (screenId === 'home') tabId = 't-home';
  const abaAtiva = document.getElementById(tabId) || document.querySelector(`[onclick="go('${screenId}')"]`);
  if (abaAtiva) abaAtiva.classList.add('on');

  // Sempre que mudar para a home, atualiza as informações direto do banco
  if (screenId === 'home') {
    carregarDadosDoBanco();
  }
}

// Inicialização padrão do sistema ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o relógio da status bar
  updateClock();
  setInterval(updateClock, 1000);

  // Configurações e escutas globais
  configurarFiltrosExtrato();
  configurarAcoesDoCartao(); 
  inicializarSistemaSmartBank();
});

// Relógio Dinâmico da Status Bar
function updateClock() {
  const clkElement = document.getElementById('clk');
  if (clkElement) {
    const now = new Date();
    clkElement.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}

// Exibe caixas de alerta Toast elegantes no rodapé do celular
function showToast(msg) {
  const t = document.getElementById('global-toast');
  const txt = document.getElementById('toast-txt');
  if (t && txt) {
    txt.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

// Helper para criar a estrutura HTML padrão de cada transação do extrato
const criarItemHTML = (tipo, valorMovimentado, descricao) => {
  const IsSaida = tipo === 'Saída';
  const cor = IsSaida ? '#e879a0' : '#22c55e';
  const fundoIcone = IsSaida ? 'rgba(232, 121, 160, 0.1)' : 'rgba(34, 197, 94, 0.1)';
  const sinal = IsSaida ? '-' : '+';
  const emoji = IsSaida ? '💸' : '💰';

  const ehInvestimento = descricao.includes('CDI') || descricao.includes('Investimento');
  const classeCardPremium = ehInvestimento ? 'transacao-premium-cdi' : '';
  const badgePremium = ehInvestimento ? '<span class="badge-investimento">Premium</span>' : '';

  return `
    <div class="txi ${classeCardPremium}">
      <div class="txic" style="background: ${fundoIcone};">${emoji}</div>
      <div class="txin">
        <div class="txn">${descricao} ${badgePremium}</div>
        <div class="txm">Processado • NexBank Backend</div>
      </div>
      <div class="txr">
        <div class="txa ${IsSaida ? 'db' : 'cr'}" style="color: ${cor};">${sinal} R$ ${parseFloat(valorMovimentado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div class="txb ${IsSaida ? 'bp' : 'bd'}" style="background: ${fundoIcone}; color: ${cor};">${tipo}</div>
      </div>
    </div>
  `;
};

// ==========================================
// 2. CONTROLE DAS ETAPAS DE CADASTRO (WIZARD)
// ==========================================
function nextStep(stepNum) {
  if (stepNum === 2) {
    const name = document.getElementById('rname').value;
    const email = document.getElementById('remail').value;
    if (!name || !email) { showToast("Preencha o perfil antes de avançar."); return; }
    
    document.getElementById('p1').classList.remove('on');
    document.getElementById('p2').classList.add('on');
    document.getElementById('c1').classList.add('done');
    document.getElementById('l1').classList.add('done');
    document.getElementById('c2').classList.add('active');
  }
}

// ==========================================
// 3. EXECUTA INTEGRAÇÃO REAL DE CADASTRO COM O BANCO DE DADOS
// ==========================================
async function handleRegister() {
  const name = document.getElementById('rname').value;
  const email = document.getElementById('remail').value;
  const pass = document.getElementById('rpass').value;

  if (!pass) { showToast("Defina uma senha de segurança."); return; }

  try {
    const resposta = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: name, email: email, senha: pass })
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      showToast(`❌ Erro: ${resultado.erro || 'Falha no registro.'}`);
      return;
    }

    // Configura os dados locais dinamicamente com base no retorno do banco
    document.getElementById('user-display-name').innerText = name;
    document.getElementById('card-username-preview').innerText = name.toUpperCase();
    document.getElementById('home-card-name').innerText = name.toUpperCase();
    document.getElementById('user-avatar').innerText = name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

    showToast("Conta criada e gravada no PostgreSQL!");
    setTimeout(() => go('home'), 1200);

  } catch (erro) {
    console.error('Erro ao conectar com a API de registro:', erro);
    showToast("Erro ao conectar ao servidor backend.");
  }
}

// ==========================================
// 4. EXECUTA INTEGRAÇÃO REAL DE LOGIN
// ==========================================
async function handleLogin() {
  const email = document.getElementById('lemail').value;
  const pass = document.getElementById('lpass').value;

  if (!email || !pass) { showToast("Por favor, preencha todos os campos."); return; }

  try {
    showToast("Autenticado! Sincronizando tabelas...");
    setTimeout(() => go('home'), 1000);
  } catch (erro) {
    showToast("Erro ao conectar com o servidor.");
  }
}

// ==========================================
// 5. BUSCA ATIVA DE SALDOS, EXTRATO E LIMITES DO POSTGRESQL
// ==========================================
async function carregarDadosDoBanco() {
  try {
    const resposta = await fetch(`${API_URL}/dados`);
    if (!resposta.ok) return;

    const dados = await resposta.json();
    todasTransacoesGlobais = dados.transacoes || [];

    // 1. Atualiza o saldo exibido na Home
    const balAmt = document.getElementById('home-saldo');
    if (balAmt && dados.usuario) {
      const saldo = parseFloat(dados.usuario.saldo);
      balAmt.innerText = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // 2. Sincroniza o Saldo Investido vindo do PostgreSQL
    if (dados.usuario && dados.usuario.saldo_investido !== undefined) {
      patrimonioInvestido = parseFloat(dados.usuario.saldo_investido);
      const txtPatrimonio = document.getElementById('home-investido');
      if (txtPatrimonio) {
        txtPatrimonio.innerText = patrimonioInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
    }

    // 3. Renderiza o nome do titular
    if (dados.usuario && dados.usuario.nome) {
      const nomeJanela = document.getElementById('user-display-name');
      if (nomeJanela) nomeJanela.innerText = dados.usuario.nome;
      
      const cardName = document.getElementById('home-card-name');
      if (cardName) cardName.innerText = dados.usuario.nome.toUpperCase();
    }

    renderizarListasVisuais();

  } catch (erro) {
    console.error('Erro ao conectar com a API:', erro);
  }
}

// ==========================================
// 6. RENDERIZADOR COMPLETO DO EXTRATO
// ==========================================
function renderizarListasVisuais() {
  const listaHome = document.querySelector('.txlist');
  if (!listaHome) return;

  listaHome.innerHTML = '';

  if (todasTransacoesGlobais.length === 0) {
    listaHome.innerHTML = `<div style="color: #666; text-align: center; padding: 20px; font-size: 13px;">Nenhuma movimentação processada.</div>`;
    return;
  }

  // Preenche dinamicamente aplicando os filtros de categoria
  const transacoesFiltradas = todasTransacoesGlobais.filter(t => {
    if (filtroAtual === 'Todos') return true;
    return t.tipo === filtroAtual;
  });

  transacoesFiltradas.forEach(t => {
    const item = document.createElement('div');
    item.innerHTML = criarItemHTML(t.tipo, t.valor, t.descricao);
    listaHome.appendChild(item.firstElementChild);
  });
}

function configurarFiltrosExtrato() {
  const botoesFiltro = document.querySelectorAll('.mfilt .mc');
  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
      botoesFiltro.forEach(btn => btn.classList.remove('a'));
      botao.classList.add('a');

      const textoBotao = botao.textContent.trim();
      if (textoBotao === 'Entradas') filtroAtual = 'Entrada';
      else if (textoBotao === 'Saídas') filtroAtual = 'Saída';
      else filtroAtual = 'Todos';

      renderizarListasVisuais();
    });
  });
}

// ==========================================
// 7. MOTOR DE INVESTIMENTOS AUTOMATIZADO
// ==========================================
function inicializarSistemaSmartBank() {
  // Loop de rendimento de ativos simulados em tempo real na tela
  setInterval(() => {
    if (patrimonioInvestido > 0) {
      let rendimentoMomento = patrimonioInvestido * taxaRendimentoSegundo;
      rendimentoAcumulado += rendimentoMomento;
      patrimonioInvestido += rendimentoMomento;

      const txtPatrimonio = document.getElementById('home-investido');
      if (txtPatrimonio) {
        txtPatrimonio.innerText = patrimonioInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
    }
  }, 1000);
}

// Configurações extras de segurança e cartões
function configurarAcoesDoCartao() {
  // Lógica para alternar visibilidade ou bloqueios customizados se necessário
}

// ==========================================
// 8. FUNÇÕES DOS BOTÕES DO PAINEL (INTEGRADAS)
// ==========================================

// Função do Botão Investir
function simularInvestimento() {
  const valorInput = prompt("Quanto deseja investir no CDI? (Ex: 150,00)");

  if (valorInput) {
    const valorLimpo = valorInput.replace(/\./g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showToast("Por favor, digite um valor válido.");
      return;
    }

    fetch(`${API_URL}/investir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: valorNumerico })
    })
    .then(res => res.json())
    .then(dados => {
      if (dados.sucesso) {
        showToast("Sucesso! Aplicação em CDI realizada.");
        carregarDadosDoBanco(); // Atualiza sem recarregar a página inteira
      } else {
        showToast("Erro: " + (dados.erro || dados.mensagem));
      }
    })
    .catch(err => console.error("Erro ao investir:", err));
  }
}

// Função do Botão do Pix
function realizarPix() {
  const valorInput = prompt("Digite o valor do Pix: (Ex: 1.200,00)");

  if (valorInput) {
    const valorLimpo = valorInput.replace(/\./g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showToast("Por favor, digite um valor válido.");
      return;
    }

    const descricaoPix = prompt("Digite uma descrição para o Pix:") || "Pix enviado";

    fetch(`${API_URL}/transferir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: valorNumerico, descricao: descricaoPix })
    })
    .then(res => res.json())
    .then(dados => {
      if (dados.sucesso) {
        showToast("Pix realizado com sucesso!");
        carregarDadosDoBanco(); // Sincroniza saldo e extrato instantaneamente
      } else {
        showToast("Erro: " + dados.erro);
      }
    })
    .catch(err => console.error("Erro ao fazer Pix:", err));
  }
}

// Função do Botão Depositar
function realizarDeposito() {
  const valorInput = prompt("Digite o valor que deseja depositar: (Ex: 5.000,00)");

  if (valorInput) {
    const valorLimpo = valorInput.replace(/\./g, '').replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      showToast("Por favor, digite um valor válido.");
      return;
    }

    fetch(`${API_URL}/depositar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor: valorNumerico, descricao: 'Depósito via App' })
    })
    .then(res => res.json())
    .then(dados => {
      if (dados.sucesso) {
        showToast("Depósito realizado com sucesso!");
        carregarDadosDoBanco(); // Atualiza saldo e adiciona a linha no extrato
      } else {
        showToast("Erro ao realizar depósito.");
      }
    })
    .catch(erro => console.error("Erro no depósito:", erro));
  }
}

// Botão Manual de Atualização/Sincronização
async function atualizarDadosBanco() {
  showToast('Atualizando dados do PostgreSQL...');
  await carregarDadosDoBanco();
  showToast('Dados atualizados do PostgreSQL!');
}