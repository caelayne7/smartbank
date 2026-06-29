import { useState, useEffect } from "react";

const gold = "#c9a84c";
const bg = "#080808";
const card = "#141419";
const border = "rgba(255,255,255,0.07)";
const rose = "#e879a0";
const green = "#4ade80";

function App() {
  const [tela, setTela] = useState("splash");
  const [saldoOculto, setSaldoOculto] = useState(false);
  const [chavePix, setChavePix] = useState("");
  const [valorPix, setValorPix] = useState("");
  const [modal, setModal] = useState(null);
  const [notificacao, setNotificacao] = useState(null);
  const [limiteDisponivel, setLimiteDisponivel] = useState(45000);
  const [cartaoBloqueado, setCartaoBloqueado] = useState(false);
  const [valorEmprestimo, setValorEmprestimo] = useState("10000");
  const [parcelasEmprestimo, setParcelasEmprestimo] = useState("12");
  const [valorDeposito, setValorDeposito] = useState("");
  const [investidoAcoes, setInvestidoAcoes] = useState(0);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [nomeUsuario, setNomeUsuario] = useState("Cliente");
  const [investidoCripto, setInvestidoCripto] = useState(0);
  const [historicoTx, setHistoricoTx] = useState([]);
  const [pontosMimos, setPontosMimos] = useState(120);

  // 🆕 Estados de Login e Cadastro
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [erroAuth, setErroAuth] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("nexbank_token");
    const nomeSalvo = localStorage.getItem("nexbank_nome");
    if (token) {
      setNomeUsuario(nomeSalvo || "Cliente");
      carregarDados();
      setTela("home");
    }
  }, []);

  const carregarDados = async () => {
    try {
        // 1. Busca o saldo do usuário logado usando a rota /me e enviando o token
        const resSaldo = await fetch('http://localhost:3000/api/usuario/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('nexbank_token')}`
            }
        });
        if (resSaldo.ok) {
            const dadosSaldo = await resSaldo.json();
            setSaldoAtual(parseFloat(dadosSaldo.saldo));
            setNomeUsuario(dadosSaldo.nome);
        }

        // 2. Busca o histórico usando a rota /me e enviando o token
        const resTx = await fetch('http://localhost:3000/api/transacoes/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('nexbank_token')}`
            }
        });
        if (resTx.ok) {
            const dadosTx = await resTx.json();
            const historicoFormatado = dadosTx.map(tx => ({
                id: tx.id,
                icon: tx.tipo === 'Entrada' ? "💵" : "💸",
                title: tx.tipo === 'Entrada' ? "Depósito Recebido" : "Envio de Pix",
                desc: tx.descricao,
                valor: parseFloat(tx.valor),
                tipo: tx.tipo
            }));
            setHistoricoTx(historicoFormatado);
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
};

  // 🆕 Login
  const executarLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErroAuth("");
    setCarregando(true);
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLogin, senha: senhaLogin })
      });
      const dados = await response.json();
      if (response.ok) {
        localStorage.setItem("nexbank_token", dados.token);
        localStorage.setItem("nexbank_nome", dados.usuario.nome);
        setNomeUsuario(dados.usuario.nome);
        setSaldoAtual(parseFloat(dados.usuario.saldo));
        await carregarDados();
        setTela("home");
      } else {
        setErroAuth(dados.erro || "Email ou senha incorretos.");
      }
    } catch (error) {
      setErroAuth("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  };

  // 🆕 Cadastro
  const executarCadastro = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErroAuth("");
    setCarregando(true);
    if (senhaCadastro.length < 6) {
      setErroAuth("A senha deve ter no mínimo 6 caracteres.");
      setCarregando(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeCadastro, email: emailCadastro, senha: senhaCadastro })
      });
      const dados = await response.json();
      if (response.ok) {
        localStorage.setItem("nexbank_token", dados.token);
        localStorage.setItem("nexbank_nome", dados.usuario.nome);
        setNomeUsuario(dados.usuario.nome);
        await carregarDados();
        dispararNotificacao("🎉", "Bem-vindo!", "Conta criada com sucesso!");
        setTela("home");
      } else {
        setErroAuth(dados.erro || "Erro ao criar conta.");
      }
    } catch (error) {
      setErroAuth("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  };

  // 🆕 Logout
  const executarLogout = () => {
    localStorage.removeItem("nexbank_token");
    localStorage.removeItem("nexbank_nome");
    setTela("login");
    setEmailLogin("");
    setSenhaLogin("");
    setHistoricoTx([]);
    setSaldoAtual(0);
  };

  const dispararNotificacao = (icone, titulo, msg) => {
    setNotificacao({ icone, titulo, msg });
    setTimeout(() => setNotificacao(null), 3000);
  };

  const realizarEmprestimoNoBanco = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emprestimo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexbank_token')}`
         },
        body: JSON.stringify({ valor: valorEmprestimo, parcelas: parcelasEmprestimo })
      });
      if (response.ok) {
        dispararNotificacao("💰", "Sucesso!", "Empréstimo liberado na conta!");
        setModal(null);
        await carregarDados();
      } else {
        dispararNotificacao("❌", "Erro", "Não foi possível processar seu empréstimo.");
      }
    } catch (error) {
      console.error("Erro ao solicitar empréstimo:", error);
    }
  };

  const confirmarEmprestimo = () => realizarEmprestimoNoBanco();

  const navegar = (t) => {
    if (t === "transfer") { setChavePix(""); setValorPix(""); }
    setTela(t);
  };

  const executarPix = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const v = parseFloat(valorPix);
    if (isNaN(v) || v <= 0) { dispararNotificacao("⚠️", "Erro", "Insira um valor válido para o Pix."); return; }
    if (v > saldoAtual) { dispararNotificacao("❌", "Erro", "Saldo insuficiente para realizar este Pix."); return; }
    try {
      const response = await fetch('http://localhost:3000/api/pix', {
        method: 'POST',
        headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${localStorage.getItem('nexbank_token')}`
      },
        body: JSON.stringify({ valor: v, chave: chavePix }),
      });
      const dadosDoServidor = await response.json();
      if (response.ok) {
        setHistoricoTx(p => [{ id: Date.now(), icon: "📱", title: "Pix Enviado", desc: chavePix || "Transferência", valor: v, tipo: "Saída" }, ...p]);
        setSaldoAtual(p => p - v);
        dispararNotificacao("💸", "Pix Realizado!", "R$ " + v.toLocaleString("pt-BR") + " enviados.");
        setValorPix(""); setChavePix("");
        navegar("home");
      } else {
        dispararNotificacao("⚠️", "Erro", dadosDoServidor.erro || "Erro ao processar Pix.");
      }
    } catch (error) {
      dispararNotificacao("⚠️", "Erro na conexão", "Não foi possível conectar ao servidor.");
    }
  };

  const executarDeposito = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const v = parseFloat(valorDeposito);
    if (isNaN(v) || v <= 0) { dispararNotificacao("⚠️", "Erro", "Insira um valor válido para o depósito."); return; }
    try {
      const response = await fetch('http://localhost:3000/api/depositar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nexbank_token')}`
         },
        body: JSON.stringify({ valor: v, descricao: "Depósito via Boleto - Compensação Instantânea" }),
      });
      const dadosDoServidor = await response.json();
      if (response.ok) {
        setHistoricoTx(p => [{ id: Date.now(), icon: "💵", title: "Depósito via Boleto", desc: "Compensação Instantânea", valor: v, tipo: "Entrada" }, ...p]);
        setSaldoAtual(p => p + v);
        dispararNotificacao("✅", "Depósito!", "R$ " + v.toLocaleString("pt-BR") + " adicionados.");
        setValorDeposito("");
        navegar("home");
      } else {
        dispararNotificacao("⚠️", "Erro", dadosDoServidor.erro || "Erro ao processar o depósito.");
      }
    } catch (error) {
      dispararNotificacao("⚠️", "Erro", "Não foi possível conectar ao servidor.");
    }
  };

  const simularApple = () => dispararNotificacao("🍏", "Apple Store", "Simulação de compra iniciada.");
  const simularCDI = () => dispararNotificacao("📊", "CDI", "Rendimento calculado com sucesso!");

  const avancarMercado = () => {
    if (investidoAcoes === 0 && investidoCripto === 0) { dispararNotificacao("ℹ️", "Sem Aplicações", "Invista primeiro!"); return; }
    setInvestidoAcoes(p => Math.round(p * (1 + Math.random() * 0.3 - 0.1)));
    setInvestidoCripto(p => Math.round(p * (1 + Math.random() * 0.5 - 0.2)));
    dispararNotificacao("📈", "Mercado Oscilou!", "Suas aplicações variaram.");
  };

  const aplicar = (tipo, valor) => {
    const v = parseFloat(valor);
    if (isNaN(v) || v <= 0) { dispararNotificacao("⚠️", "Erro", "Insira um valor válido para investir."); return; }
    if (v > saldoAtual) { dispararNotificacao("❌", "Erro", "Saldo insuficiente para este investimento."); return; }
    setSaldoAtual(p => p - v);
    setHistoricoTx(p => [{ id: Date.now(), icon: "📈", title: tipo === "acoes" ? "Compra de Ações" : "Compra de Cripto", desc: "Corretora NexBank", valor: v, tipo: "Saída" }, ...p]);
    if (tipo === "acoes") setInvestidoAcoes(p => p + v);
    else setInvestidoCripto(p => p + v);
    dispararNotificacao("💰", "Aplicação!", "Valor enviado à carteira.");
  };

  const executarContratacao = () => confirmarEmprestimo();

  const saldoFormatado = saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inputStyle = {
    width: "100%", padding: "12px", background: "#141419",
    border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
    borderRadius: "8px", fontSize: "14px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box"
  };

  const btnStyle = {
    width: "100%", padding: "14px", background: "linear-gradient(135deg, #7c3aed, #9333ea)",
    color: "#fff", fontSize: "14px", fontWeight: "700", border: "none",
    borderRadius: "10px", cursor: "pointer", fontFamily: "inherit"
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#000", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: bg, borderRadius: 54, border: "2px solid #222", boxShadow: "0 0 1px #111, 0 40px 100px rgba(0,0,0,0.8)", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>

        {/* NOTIFICAÇÃO */}
        {notificacao && (
          <div style={{ position: "absolute", top: 60, left: 15, right: 15, zIndex: 9999, background: "rgba(20,20,25,0.97)", border: "1px solid " + gold, borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 24 }}>{notificacao.icone}</div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>{notificacao.titulo}</div>
              <div style={{ color: "#aaa", fontSize: 11 }}>{notificacao.msg}</div>
            </div>
          </div>
        )}

        {/* MODAL */}
        {modal && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#111116", border: "1px solid " + gold, borderRadius: 16, padding: 24, width: "100%", maxWidth: 280, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{modal.icone}</div>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>{modal.titulo}</div>
              <div style={{ color: "#999", fontSize: 13, marginBottom: 20 }}>{modal.msg}</div>
              <button style={btnStyle} onClick={() => setModal(null)}>Entendido</button>
            </div>
          </div>
        )}

        {/* NOTCH */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, background: "#000", borderRadius: "0 0 18px 18px", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <div style={{ width: 50, height: 5, borderRadius: 3, background: "#1a1a1a" }}></div>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #222" }}></div>
        </div>

        {/* SCREENS */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative", background: bg, marginTop: 30 }}>

          {/* SPLASH */}
          {tela === "splash" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "radial-gradient(ellipse at 50% -20%, #2a0a50, #080808)" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🏦</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>
                Nex<span style={{ color: gold }}>Bank</span>
              </div>
              <div style={{ color: "#555", fontSize: 13, marginBottom: 48 }}>Terminal Financeiro Premium</div>
              <button style={btnStyle} onClick={() => navegar("login")}>Entrar</button>
              <button onClick={() => navegar("cadastro")} style={{ marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#aaa", padding: "14px", borderRadius: 10, cursor: "pointer", width: "100%", fontSize: 14, fontFamily: "inherit", fontWeight: 700 }}>
                Criar conta
              </button>
            </div>
          )}

          {/* 🆕 LOGIN */}
          {tela === "login" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Entrar na conta</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>NexBank Terminal</div>
              </div>
              <form onSubmit={executarLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Email</div>
                  <input style={inputStyle} type="email" placeholder="seu@email.com" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Senha</div>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} />
                </div>
                {erroAuth && (
                  <div style={{ background: "rgba(232,121,160,0.1)", border: "1px solid rgba(232,121,160,0.3)", borderRadius: 8, padding: 10, fontSize: 12, color: rose, textAlign: "center" }}>
                    {erroAuth}
                  </div>
                )}
                <button type="submit" style={{ ...btnStyle, marginTop: 8, opacity: carregando ? 0.7 : 1 }} disabled={carregando}>
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <span style={{ fontSize: 13, color: "#555" }}>Não tem conta? </span>
                <span onClick={() => { navegar("cadastro"); setErroAuth(""); }} style={{ fontSize: 13, color: gold, cursor: "pointer", fontWeight: 600 }}>Cadastre-se</span>
              </div>
            </div>
          )}

          {/* 🆕 CADASTRO */}
          {tela === "cadastro" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📝</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Criar conta</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>NexBank Terminal</div>
              </div>
              <form onSubmit={executarCadastro} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Nome completo</div>
                  <input style={inputStyle} type="text" placeholder="Seu nome" value={nomeCadastro} onChange={e => setNomeCadastro(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Email</div>
                  <input style={inputStyle} type="email" placeholder="seu@email.com" value={emailCadastro} onChange={e => setEmailCadastro(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Senha (mínimo 6 caracteres)</div>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={senhaCadastro} onChange={e => setSenhaCadastro(e.target.value)} />
                </div>
                {erroAuth && (
                  <div style={{ background: "rgba(232,121,160,0.1)", border: "1px solid rgba(232,121,160,0.3)", borderRadius: 8, padding: 10, fontSize: 12, color: rose, textAlign: "center" }}>
                    {erroAuth}
                  </div>
                )}
                <button type="submit" style={{ ...btnStyle, marginTop: 8, opacity: carregando ? 0.7 : 1 }} disabled={carregando}>
                  {carregando ? "Criando conta..." : "Criar conta"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <span style={{ fontSize: 13, color: "#555" }}>Já tem conta? </span>
                <span onClick={() => { navegar("login"); setErroAuth(""); }} style={{ fontSize: 13, color: gold, cursor: "pointer", fontWeight: 600 }}>Entrar</span>
              </div>
            </div>
          )}

          {/* HOME */}
          {tela === "home" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#666" }}>Bem-vindo de volta</div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{nomeUsuario}</div>
                </div>
                <div onClick={executarLogout} style={{ fontSize: 22, cursor: "pointer", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "6px 10px" }}>🚪</div>
              </div>

              <div style={{ margin: "8px 16px", background: "linear-gradient(135deg, #1a0a2e, #2d1060)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Saldo Disponível</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: gold }}>
                    {saldoOculto ? "••••••" : "R$ " + saldoFormatado}
                  </div>
                  <div onClick={() => setSaldoOculto(!saldoOculto)} style={{ cursor: "pointer", fontSize: 18, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 10px" }}>
                    {saldoOculto ? "🙈" : "👁️"}
                  </div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#555" }}>Limite</div>
                    <div style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>R$ {limiteDisponivel.toLocaleString("pt-BR")}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#555" }}>Mimos</div>
                    <div style={{ fontSize: 12, color: gold, fontWeight: 600 }}>{pontosMimos} pts</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#555" }}>Cartão</div>
                    <div style={{ fontSize: 12, color: cartaoBloqueado ? rose : green, fontWeight: 600 }}>{cartaoBloqueado ? "🔒 Bloq." : "✅ Ativo"}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "12px 16px 8px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Operações</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { icon: "💸", label: "Pix", tela: "transfer" },
                    { icon: "📈", label: "Bolsa", tela: "investimentos" },
                    { icon: "🏦", label: "Crédito", tela: "emprestimo" },
                    { icon: "💵", label: "Boleto", tela: "deposito" },
                  ].map(op => (
                    <div key={op.tela} onClick={() => navegar(op.tela)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <div style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(107,33,168,0.14)", border: "1px solid rgba(147,51,234,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{op.icon}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{op.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "4px 16px 8px", display: "flex", gap: 8 }}>
                {[
                  { icon: "🍏", label: "Apple Store", fn: simularApple },
                  { icon: cartaoBloqueado ? "🔓" : "🔒", label: cartaoBloqueado ? "Desbloquear" : "Bloquear", fn: () => { setCartaoBloqueado(p => !p); dispararNotificacao("💳", "Cartão", cartaoBloqueado ? "Ativado!" : "Bloqueado!"); } },
                  { icon: "📊", label: "CDI Rápido", fn: simularCDI },
                ].map((a, i) => (
                  <div key={i} onClick={a.fn} style={{ flex: 1, background: card, border: "1px solid " + border, borderRadius: 12, padding: "10px 6px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 20 }}>{a.icon}</div>
                    <div style={{ fontSize: 9, color: "#666", marginTop: 4 }}>{a.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "8px 16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Histórico Recente</div>
                {historicoTx.length === 0 && (
                  <div style={{ textAlign: "center", color: "#444", fontSize: 13, padding: "20px 0" }}>Nenhuma transação</div>
                )}
                {historicoTx.slice(0, 5).map(tx => {
                  const saida = tx.tipo === "Saída" || Number(tx.valor) < 0;
                  return (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: saida ? "rgba(232,121,160,0.1)" : "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {tx.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.title}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{tx.desc}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: saida ? rose : green, flexShrink: 0 }}>
                        {saida ? "-" : "+"} R$ {Math.abs(tx.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PIX */}
          {tela === "transfer" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div onClick={() => navegar("home")} style={{ cursor: "pointer", fontSize: 22, color: "#fff" }}>←</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Enviar Pix</div>
              </div>
              <form onSubmit={executarPix} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Chave de Destino</div>
                  <input style={inputStyle} type="text" placeholder="CPF, e-mail, telefone ou chave" value={chavePix} onChange={e => setChavePix(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Valor (R$)</div>
                  <input style={inputStyle} type="number" placeholder="0,00" value={valorPix} onChange={e => setValorPix(e.target.value)} />
                </div>
                <button type="submit" style={{ ...btnStyle, marginTop: 8 }}>Confirmar Transferência</button>
              </form>
            </div>
          )}

          {/* INVESTIMENTOS */}
          {tela === "investimentos" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div onClick={() => navegar("home")} style={{ cursor: "pointer", fontSize: 22, color: "#fff" }}>←</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Corretora NexBank</div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, background: "linear-gradient(135deg,#0d1117,#141419)", padding: 14, borderRadius: 12, border: "1px solid " + border }}>
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>📊 Ações</div>
                  <div style={{ fontSize: 16, color: "#fff", fontWeight: "bold" }}>R$ {investidoAcoes.toLocaleString("pt-BR")}</div>
                </div>
                <div style={{ flex: 1, background: "linear-gradient(135deg,#0d1117,#141419)", padding: 14, borderRadius: 12, border: "1px solid " + border }}>
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>₿ Cripto</div>
                  <div style={{ fontSize: 16, color: "#fff", fontWeight: "bold" }}>R$ {investidoCripto.toLocaleString("pt-BR")}</div>
                </div>
              </div>
              <button style={{ ...btnStyle, background: gold, color: "#000", marginBottom: 16 }} onClick={avancarMercado}>🕒 Oscilar Mercado</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { title: "Ibovespa Fracionado", sub: "Lote R$ 1.000", fn: () => aplicar("acoes", 1000) },
                  { title: "Bitcoin (BTC)", sub: "Fração R$ 500", fn: () => aplicar("cripto", 500) },
                  { title: "Rendimento CDI", sub: "+R$ 12.500 simulado", fn: simularCDI },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#09090b", border: "1px solid " + border, padding: 14, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>{item.title}</div>
                      <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{item.sub}</div>
                    </div>
                    <button onClick={item.fn} style={{ ...btnStyle, width: "auto", padding: "8px 14px", fontSize: 12 }}>
                      {i === 2 ? "Simular" : "Comprar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EMPRÉSTIMO */}
          {tela === "emprestimo" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div onClick={() => navegar("home")} style={{ cursor: "pointer", fontSize: 22, color: "#fff" }}>←</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Crédito Pré-Aprovado</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Valor</div>
                  <select value={valorEmprestimo} onChange={(e) => setValorEmprestimo(e.target.value)} style={{ ...inputStyle, background: "#09090b" }}>
                    <option value="5000">R$ 5.000,00</option>
                    <option value="10000">R$ 10.000,00</option>
                    <option value="50000">R$ 50.000,00</option>
                    <option value="200000">R$ 200.000,00</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Parcelamento</div>
                  <select value={parcelasEmprestimo} onChange={(e) => setParcelasEmprestimo(e.target.value)} style={{ ...inputStyle, background: "#09090b" }}>
                    <option value="12">12x - Taxa 1.2% a.m</option>
                    <option value="24">24x - Taxa 1.5% a.m</option>
                    <option value="48">48x - Taxa 1.9% a.m</option>
                  </select>
                </div>
                <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: "gold" }}>💡 Total a pagar: R$ {(parseFloat(valorEmprestimo) * 1.15).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <button onClick={executarContratacao} style={{ ...btnStyle, marginTop: 10 }}>Contratar Empréstimo</button>
              </div>
            </div>
          )}

          {/* DEPÓSITO */}
          {tela === "deposito" && (
            <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div onClick={() => navegar("home")} style={{ cursor: "pointer", fontSize: 22, color: "#fff" }}>←</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Depósito via Boleto</div>
              </div>
              <form onSubmit={executarDeposito} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Valor (R$)</div>
                  <input type="number" placeholder="0,00" value={valorDeposito} onChange={(e) => setValorDeposito(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={{ ...btnStyle, marginTop: 8 }}>Gerar e Liquidar Boleto</button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App; 