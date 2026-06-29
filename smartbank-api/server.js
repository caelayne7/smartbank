require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ==========================================
// 🔒 MIDDLEWARE DE AUTENTICAÇÃO JWT
// ==========================================
const autenticar = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

// ==========================================
// 🔐 ROTA DE CADASTRO (Método POST)
// ==========================================
app.post('/api/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailExiste.rows.length > 0) {
      return res.status(400).json({ erro: 'Este email já está cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, salt);

    const resultado = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, saldo, limite, saldo_investido) VALUES ($1, $2, $3, 1000.00, 5000.00, 0.00) RETURNING id, nome, email',
      [nome, email, senhaCriptografada]
    );

    const novoUsuario = resultado.rows[0];

    const token = jwt.sign(
      { id: novoUsuario.id, email: novoUsuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Cadastro realizado com sucesso!',
      token,
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
    });

  } catch (err) {
    console.error('Erro no cadastro:', err.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ==========================================
// 🔑 ROTA DE LOGIN (Método POST)
// ==========================================
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (resultado.rows.length === 0) {
      return res.status(400).json({ erro: 'Email ou senha incorretos.' });
    }

    const usuario = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(400).json({ erro: 'Email ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, saldo: usuario.saldo }
    });

  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// ==========================================
// 1. BUSCAR DADOS DO USUÁRIO LOGADO (Método GET)
// ==========================================
app.get('/api/usuario/me', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, nome, email, saldo, limite, saldo_investido FROM usuarios WHERE id = $1',
      [req.usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar dados do usuário.' });
  }
});

// ==========================================
// 2. BUSCAR TRANSAÇÕES DO USUÁRIO LOGADO (Método GET)
// ==========================================
app.get('/api/transacoes/me', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, tipo, descricao, valor, data_criacao FROM transacoes WHERE usuario_id = $1 ORDER BY data_criacao DESC',
      [req.usuarioId]
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao buscar transações.' });
  }
});

// ==========================================
// 3. REALIZAR PIX (Método POST)
// ==========================================
app.post('/api/pix', autenticar, async (req, res) => {
  const { valor, chave } = req.body;
  const valorNum = parseFloat(valor);

  if (!valor || isNaN(valorNum) || valorNum <= 0) {
    return res.status(400).json({ erro: 'Valor de Pix inválido.' });
  }

  try {
    const usuarioRes = await pool.query('SELECT saldo FROM usuarios WHERE id = $1', [req.usuarioId]);
    const saldoAtual = parseFloat(usuarioRes.rows[0].saldo);

    if (saldoAtual < valorNum) {
      return res.status(400).json({ erro: 'Saldo insuficiente para realizar esta transferência.' });
    }

    await pool.query('UPDATE usuarios SET saldo = saldo - $1 WHERE id = $2', [valorNum, req.usuarioId]);

    const descricao = `Pix enviado para a chave: ${chave}`;
    await pool.query(
      'INSERT INTO transacoes (usuario_id, tipo, descricao, valor) VALUES ($1, $2, $3, $4)',
      [req.usuarioId, 'Saída', descricao, valorNum]
    );

    res.json({ sucesso: true, mensagem: 'Pix realizado com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao processar o Pix no servidor.' });
  }
});

// ==========================================
// 4. REALIZAR DEPÓSITO (Método POST)
// ==========================================
app.post('/api/depositar', autenticar, async (req, res) => {
  const { valor, descricao } = req.body;
  const v = parseFloat(valor);

  if (!v || v <= 0) {
    return res.status(400).json({ erro: 'Valor de depósito inválido' });
  }

  try {
    await pool.query('UPDATE usuarios SET saldo = saldo + $1 WHERE id = $2', [v, req.usuarioId]);
    await pool.query(
      'INSERT INTO transacoes (usuario_id, tipo, descricao, valor) VALUES ($1, $2, $3, $4)',
      [req.usuarioId, 'Entrada', descricao || 'Depósito recebido', v]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao fazer o depósito' });
  }
});

// ==========================================
// 5. REALIZAR EMPRÉSTIMO (Método POST)
// ==========================================
app.post('/api/emprestimo', autenticar, async (req, res) => {
  const { valor, parcelas } = req.body;
  const valorNum = parseFloat(valor);

  if (!valor || isNaN(valorNum) || valorNum <= 0) {
    return res.status(400).json({ erro: 'Valor de empréstimo inválido.' });
  }

  try {
    await pool.query('UPDATE usuarios SET saldo = saldo + $1 WHERE id = $2', [valorNum, req.usuarioId]);

    const descricao = `Empréstimo aprovado em ${parcelas}x`;
    await pool.query(
      'INSERT INTO transacoes (usuario_id, tipo, descricao, valor) VALUES ($1, $2, $3, $4)',
      [req.usuarioId, 'Entrada', descricao, valorNum]
    );

    res.json({ sucesso: true, mensagem: 'Empréstimo concedido com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao processar empréstimo no servidor.' });
  }
});

// ==========================================
// 6. REALIZAR INVESTIMENTO (Método POST)
// ==========================================
app.post('/api/investir', autenticar, async (req, res) => {
  const { valor } = req.body;
  const v = parseFloat(valor);

  if (!v || v <= 0) {
    return res.status(400).json({ erro: 'Valor de investimento inválido' });
  }

  try {
    await pool.query('BEGIN');

    const usuarioRes = await pool.query('SELECT saldo FROM usuarios WHERE id = $1', [req.usuarioId]);
    const saldoAtual = parseFloat(usuarioRes.rows[0].saldo);

    if (v > saldoAtual) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ erro: 'Saldo insuficiente para investir' });
    }

    await pool.query(
      'UPDATE usuarios SET saldo = saldo - $1, saldo_investido = saldo_investido + $1 WHERE id = $2',
      [v, req.usuarioId]
    );
    await pool.query(
      'INSERT INTO transacoes (usuario_id, tipo, descricao, valor) VALUES ($1, $2, $3, $4)',
      [req.usuarioId, 'Saída', 'Aplicação em CDI', v]
    );

    await pool.query('COMMIT');
    res.json({ sucesso: true });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao processar investimento' });
  }
});

// ==========================================
// 7. ATUALIZAR NOME DO USUÁRIO (Método PUT)
// ==========================================
app.put('/api/usuario', autenticar, async (req, res) => {
  const { nome } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'O nome não pode estar vazio.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE usuarios SET nome = $1 WHERE id = $2 RETURNING *',
      [nome, req.usuarioId]
    );
    res.json({ sucesso: true, usuario: resultado.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro ao atualizar os dados do usuário');
  }
});

// ==========================================
// 8. ATUALIZAR LIMITE DO CARTÃO (Método PUT)
// ==========================================
app.put('/api/usuario/limite', autenticar, async (req, res) => {
  const { limite } = req.body;
  const novoLimite = parseFloat(limite);

  if (isNaN(novoLimite) || novoLimite < 0) {
    return res.status(400).json({ erro: 'Valor de limite inválido.' });
  }

  try {
    const resultado = await pool.query(
      'UPDATE usuarios SET limite = $1 WHERE id = $2 RETURNING *',
      [novoLimite, req.usuarioId]
    );
    res.json({ sucesso: true, usuario: resultado.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro ao atualizar o limite do cartão');
  }
});

// ==========================================
// 9. DELETAR TRANSAÇÃO (Método DELETE)
// ==========================================
app.delete('/api/transacao/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query(
      'DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [id, req.usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Transação não encontrada.' });
    }

    res.json({ sucesso: true, mensagem: 'Transação deletada com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro ao deletar transação.' });
  }
});

// Inicialização do servidor
app.listen(3000, () => {
  console.log('🚀 Servidor do SmartBank a rodar na porta 3000!');
});