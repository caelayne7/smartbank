# 🏦 SmartBank — Banco Digital

Projeto pessoal de banco digital desenvolvido para aprimorar conhecimentos em desenvolvimento back-end, APIs REST e integração com banco de dados.

---

## 📋 Sobre o Projeto

O SmartBank é uma aplicação de banco digital que simula operações financeiras reais, como transferências via Pix, depósitos, empréstimos e investimentos. O projeto conta com autenticação segura de usuários, interface moderna integrada a uma API REST e banco de dados relacional PostgreSQL.

---

## ✨ Funcionalidades

- 🔐 **Cadastro de usuário** — criação de conta com senha criptografada
- 🔑 **Login** — autenticação segura com JWT
- 💸 **Transferência via Pix** — envio de valores com atualização em tempo real
- 💵 **Depósito via Boleto** — adição de saldo à conta
- 🏦 **Empréstimo** — solicitação de crédito pré-aprovado com parcelamento
- 📈 **Investimentos** — compra de ações e criptomoedas simuladas
- 💳 **Cartão** — bloqueio e desbloqueio do cartão
- 📊 **Histórico de transações** — extrato completo salvo no banco de dados
- 🗑️ **Deletar transação** — remoção de transações do histórico
- 👁️ **Ocultar saldo** — privacidade na visualização do saldo

---

## 🛠️ Tecnologias Utilizadas

### Front-end
- React.js
- JavaScript (ES6+)
- CSS com estilos inline

### Back-end
- Node.js
- Express.js
- bcrypt (criptografia de senhas)
- jsonwebtoken — JWT (autenticação)

### Banco de Dados
- PostgreSQL
- pgAdmin 4

### Ferramentas
- Git e GitHub
- VS Code
- Vite

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `usuarios`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | SERIAL PRIMARY KEY | Identificador único |
| nome | VARCHAR(100) | Nome do usuário |
| email | VARCHAR(150) | E-mail único |
| senha | VARCHAR(255) | Senha criptografada com bcrypt |
| saldo | NUMERIC(10,2) | Saldo disponível |
| limite | NUMERIC(10,2) | Limite do cartão |
| saldo_investido | NUMERIC(10,2) | Total investido |

### Tabela `transacoes`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | SERIAL PRIMARY KEY | Identificador único |
| usuario_id | INTEGER | Referência ao usuário |
| tipo | VARCHAR(10) | Entrada ou Saída |
| descricao | VARCHAR(150) | Descrição da transação |
| valor | NUMERIC(10,2) | Valor da transação |
| data_criacao | TIMESTAMP | Data e hora |

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado
- PostgreSQL instalado
- pgAdmin 4

### 1. Clone o repositório
```bash
git clone https://github.com/caelayne7/smartbank.git
cd smartbank
```

### 2. Configure o banco de dados
- Crie um banco chamado `smartbank` no pgAdmin
- Execute os scripts SQL para criar as tabelas

### 3. Inicie o back-end
```bash
cd smartbank-api
npm install
node server.js
```

### 4. Inicie o front-end
```bash
cd nexbank-react
npm install
npm run dev
```

### 5. Acesse no navegador
```
http://localhost:5174
```

---

## 📡 Rotas da API

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | /api/cadastro | Cadastra novo usuário |
| POST | /api/login | Autentica usuário e retorna JWT |

### Usuário
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/usuario/:id | Busca dados do usuário |
| GET | /api/dados | Busca saldo e extrato |
| PUT | /api/usuario | Atualiza nome do usuário |
| PUT | /api/usuario/limite | Atualiza limite do cartão |

### Operações Financeiras
| Método | Rota | Descrição |
|---|---|---|
| POST | /api/pix | Realiza transferência Pix |
| POST | /api/depositar | Realiza depósito |
| POST | /api/emprestimo | Solicita empréstimo |
| POST | /api/investir | Realiza investimento |
| POST | /api/transferir | Realiza transferência |

### Transações
| Método | Rota | Descrição |
|---|---|---|
| GET | /api/transacoes/:id | Lista transações do usuário |
| DELETE | /api/transacao/:id | Deleta uma transação |

---

## 🔒 Segurança

- Senhas criptografadas com **bcrypt**
- Autenticação via **JWT (JSON Web Token)**
- Validação de dados nas rotas da API
- Verificação de saldo antes de cada transação

---

## 👩‍💻 Autora

Desenvolvido com 💜 como projeto pessoal para aprimoramento em desenvolvimento back-end.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/caelayne-aparecida-ribeirosoares7ab68235a?utm_source=share_via&utm_content=profile&utm_medium=member_android)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/caelayne7) 
