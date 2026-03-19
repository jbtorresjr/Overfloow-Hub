/**
 * Overfloow Hub — Server
 * Node.js + Express + Prisma v7 + PostgreSQL
 *
 * Auth: bcryptjs + JWT (tabela overfloow.usuarios)
 * Aulas: le arquivos .md da pasta Aulas
 *
 * Iniciar: node server.js
 * Acesso:  http://localhost:3000
 */

'use strict';
// Carrega .env com caminho absoluto (necessario para PM2)
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const fs = require('fs');
const path = require('path');

// --- Auth libs ---------------------------------------------------
let bcrypt, jwt, prisma;
const JWT_SECRET = process.env.JWT_SECRET || 'overfloow-dev-secret-2026';

try {
  bcrypt = require('bcryptjs');
  jwt = require('jsonwebtoken');
  prisma = require('./prisma/client');
  console.log('[OK] Prisma + bcrypt + JWT carregados');
  console.log('[DB]', process.env.DATABASE_URL ? 'DATABASE_URL configurado' : 'SEM DATABASE_URL!');
} catch (e) {
  console.warn('[AVISO] Prisma nao disponivel - usando modo demo:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- Caminhos dos recursos --------------------------------------
const AULAS_DIR = path.join('C:\\Devs\\PlataformaOF\\Overfloow\\Aulas');

// --- Mapeamento de cores por area -------------------------------
const AREAS = {
  TES: { nome: 'Tesouraria', cor: '#1A3A6C', icone: '💰' },
  FIS: { nome: 'Fiscal', cor: '#0A6E5D', icone: '📋' },
  RHO: { nome: 'RH Operacional', cor: '#5A2D82', icone: '👥' },
  MKT: { nome: 'Marketing', cor: '#C4380C', icone: '📣' },
  TIC: { nome: 'TI&C', cor: '#005FAD', icone: '⚙️' },
  EST: { nome: 'Estoque', cor: '#8B4513', icone: '📦' },
  COM: { nome: 'Compras', cor: '#2D6A4F', icone: '🛒' },
  FAT: { nome: 'Faturamento', cor: '#A07000', icone: '🧾' },
  SAC: { nome: 'Atendimento', cor: '#A0154A', icone: '🎧' },
};

// --- Modulos padrao (admin) -------------------------------------
const MODULOS_ADMIN = [
  { codigo: 'AULAS', nome: 'Aulas', icone: '📚', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
  { codigo: 'EDITORA', nome: 'E-Books', icone: '📖', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
  { codigo: 'AVALIACAO', nome: 'Avaliação', icone: '🏆', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
  { codigo: 'RELATORIOS', nome: 'Relatórios', icone: '📊', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
  { codigo: 'ADMIN', nome: 'Administração', icone: '⚙️', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
];

// --- DEMO_USERS (fallback quando banco nao disponivel) ----------
const DEMO_USERS = [
  {
    id: 1, email: 'admin@overfloow.com', senha: 'admin123',
    nome: 'Administração', grupo: 'ADMIN', cor: '#1A3A6C',
    modulos: MODULOS_ADMIN,
  },
  {
    id: 2, email: 'gerente@overfloow.com', senha: 'gerente123',
    nome: 'Gerente DEV', grupo: 'GERENTE_DEV', cor: '#5A2D82',
    modulos: [
      { codigo: 'AULAS', nome: 'Aulas', icone: '📚', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
      { codigo: 'EDITORA', nome: 'E-Books', icone: '📖', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
      { codigo: 'AVALIACAO', nome: 'Avaliação', icone: '🏆', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
      { codigo: 'RELATORIOS', nome: 'Relatórios', icone: '📊', perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
    ],
  },
  {
    id: 3, email: 'professor@overfloow.com', senha: 'prof123',
    nome: 'Professor Demo', grupo: 'PROFESSOR', cor: '#0A6E5D',
    modulos: [
      { codigo: 'AULAS', nome: 'Aulas', icone: '📚', perm_acesso: true, perm_inclusao: false, perm_edicao: false, perm_exclusao: false, perm_exportacao: false, perm_impressao: true },
      { codigo: 'AVALIACAO', nome: 'Avaliação', icone: '🏆', perm_acesso: true, perm_inclusao: true, perm_edicao: false, perm_exclusao: false, perm_exportacao: true, perm_impressao: true },
      { codigo: 'RELATORIOS', nome: 'Relatórios', icone: '📊', perm_acesso: true, perm_inclusao: false, perm_edicao: false, perm_exclusao: false, perm_exportacao: true, perm_impressao: false },
    ],
  },
  {
    id: 4, email: 'aluno@overfloow.com', senha: 'aluno123',
    nome: 'Aluno Demo', grupo: 'ALUNO', cor: '#A07000',
    modulos: [
      { codigo: 'AULAS', nome: 'Aulas', icone: '📚', perm_acesso: true, perm_inclusao: false, perm_edicao: false, perm_exclusao: false, perm_exportacao: false, perm_impressao: true },
      { codigo: 'AVALIACAO', nome: 'Avaliação', icone: '🏆', perm_acesso: true, perm_inclusao: false, perm_edicao: false, perm_exclusao: false, perm_exportacao: false, perm_impressao: false },
    ],
  },
];

// --- Static files -----------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// --- Rota: raiz -------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hub.html'));
});

// --- Rota: hub --------------------------------------------------
app.get('/hub', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hub.html'));
});

// --- Rota: login ------------------------------------------------
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- Rota: learn ------------------------------------------------
app.get('/learn', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'learn.html'));
});

// --- Rota: work -------------------------------------------------
app.get('/work', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'work.html'));
});

// --- Rota: Mapa de areas ----------------------------------------
app.get('/api/areas', (req, res) => {
  res.json(AREAS);
});

// --- Rota: Listar aulas -----------------------------------------
app.get('/api/aulas', (req, res) => {
  try {
    if (!fs.existsSync(AULAS_DIR)) return res.json([]);

    const arquivos = fs.readdirSync(AULAS_DIR).filter(f => f.endsWith('.md'));

    const aulas = arquivos.map(arquivo => {
      const codigo = arquivo.replace('.md', '');
      const partes = codigo.split('-');
      const areaCod = partes[0] || 'TES';
      const area = AREAS[areaCod] || AREAS.TES;

      const conteudo = fs.readFileSync(path.join(AULAS_DIR, arquivo), 'utf-8');
      const linhas = conteudo.split('\n');

      const titulo = extrairCampo(linhas, 'SubProcesso / Detalhe') || codigo;
      const tempo = extrairCampo(linhas, 'Tempo Estimado') || '2h';
      const nivelCHAM = extrairCampo(linhas, 'Nível CHAM Mínimo — Humano') || 'C1·H1·A1·M1';
      const prereq = extrairCampo(linhas, 'Pré-requisito') || '—';
      const status = 'rascunho';

      return { codigo, areaCod, area, titulo, tempo, nivelCHAM, prereq, status };
    });

    aulas.sort((a, b) => a.codigo.localeCompare(b.codigo));
    res.json(aulas);

  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// --- Rota: Conteudo de uma aula ---------------------------------
app.get('/api/aulas/:codigo', (req, res) => {
  const { codigo } = req.params;
  const arquivo = path.join(AULAS_DIR, `${codigo}.md`);

  if (!fs.existsSync(arquivo))
    return res.status(404).json({ erro: `Aula ${codigo} nao encontrada` });

  const conteudo = fs.readFileSync(arquivo, 'utf-8');
  const areaCod = codigo.split('-')[0] || 'TES';
  const area = AREAS[areaCod] || AREAS.TES;

  res.json({ codigo, areaCod, area, conteudo });
});

// === AUTH =========================================================

// --- POST /api/auth/login ----------------------------------------
// Producao: Prisma + bcrypt + JWT
// Fallback: DEMO_USERS (banco indisponivel ou Prisma nao instalado)
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha)
    return res.status(400).json({ erro: 'E-mail e senha sao obrigatorios.' });

  // Banco real
  if (prisma && bcrypt && jwt) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { email },
        include: { perfis: { include: { perfil: true } } },
      });
      
      if (user) {
        const senhaOk = await bcrypt.compare(senha, user.senha_hash);
        
        if (user.ativo && senhaOk) {
          const perfis = user.perfis.map(up => up.perfil.nome);
          const isAdmin = perfis.includes('admin_plataforma');
          const token = jwt.sign(
            { id: user.id_usuario, email: user.email, nome: user.nome },
            JWT_SECRET, { expiresIn: '8h' }
          );
          return res.json({
            ok: true, token,
            usuario: {
              id: user.id_usuario,
              email: user.email,
              nome: user.nome,
              grupo: isAdmin ? 'ADMIN' : (perfis[0] || 'USER'),
              cor: '#1A3A6C',
              modulos: MODULOS_ADMIN,
              perfis,
            },
          });
        }
        return res.status(401).json({ erro: 'Credenciais inválidas no banco.' });
      }
    } catch (dbErr) {
      console.error('[AVISO] Prisma login err - fallback demo:', dbErr.message);
    }
  }

  // Fallback DEMO_USERS
  const demo = DEMO_USERS.find(u => u.email === email && u.senha === senha);
  if (!demo) return res.status(401).json({ erro: 'Credenciais invalidas.' });
  res.json({
    ok: true, token: null,
    usuario: { id: demo.id, email: demo.email, nome: demo.nome, grupo: demo.grupo, cor: demo.cor, modulos: demo.modulos },
  });
});

// --- GET /api/auth/me -------------------------------------------
// Producao: verifica JWT Bearer | Fallback: X-User-Email (demo)
app.get('/api/auth/me', async (req, res) => {
  if (jwt && prisma) {
    const auth = req.headers['authorization'];
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await prisma.usuario.findUnique({
          where: { id_usuario: payload.id },
          include: { perfis: { include: { perfil: true } } },
        });
        if (!user || !user.ativo) return res.status(401).json({ erro: 'Sessao invalida.' });
        const perfis = user.perfis.map(up => up.perfil.nome);
        const isAdmin = perfis.includes('admin_plataforma');
        return res.json({
          id: user.id_usuario, email: user.email, nome: user.nome,
          grupo: isAdmin ? 'ADMIN' : (perfis[0] || 'USER'), cor: '#1A3A6C', perfis,
          modulos: MODULOS_ADMIN,
        });
      } catch (_) { /* token invalido - fallback */ }
    }
  }
  // Fallback demo
  const email = req.headers['x-user-email'];
  const user = DEMO_USERS.find(u => u.email === email);
  if (!user) return res.status(401).json({ erro: 'Nao autenticado.' });
  res.json({ id: user.id, email: user.email, nome: user.nome, grupo: user.grupo, cor: user.cor, modulos: user.modulos });
});

// --- GET /api/clientes ------------------------------------------
// Lista clientes do banco (ou demo se banco indisponivel)
app.get('/api/clientes', async (req, res) => {
  if (prisma) {
    try {
      const clientes = await prisma.cliente.findMany({
        where: { ativo: true },
        orderBy: { razao_social: 'asc' },
        select: { id_cliente: true, razao_social: true, nome: true, segmento: true },
      });
      return res.json(clientes.map(c => ({
        id: c.id_cliente,
        nome: c.nome || c.razao_social,
        razao_social: c.razao_social,
        segmento: c.segmento,
      })));
    } catch (e) {
      console.error('[AVISO] Prisma clientes err:', e.message);
    }
  }
  // Fallback demo
  res.json([
    { id: 1, nome: 'KIFF FOODS S/A', razao_social: 'KIFF FOODS S/A' },
    { id: 2, nome: 'PJ CONTABILIDADE DIGITAL LTDA', razao_social: 'PJ CONTABILIDADE DIGITAL LTDA' },
    { id: 3, nome: 'Overfloow (Interno)', razao_social: 'OVERFLOOW APOIO ADMINISTRATIVO LTDA' },
  ]);
});

// --- Rotas Módulo Custos de Clientes (Work) ---------------------
// GET /api/custos
app.get('/api/custos', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const { clienteId, status, mes } = req.query;
    const where = {};
    if (clienteId) where.id_cliente = parseInt(clienteId, 10);
    if (status) where.status = status;
    if (mes) {
      const start = new Date(`${mes}-01T00:00:00.000Z`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      where.data_custo = { gte: start, lte: end };
    }
    const custos = await prisma.custoCliente.findMany({
      where,
      include: { cliente: { select: { razao_social: true, nome: true } } },
      orderBy: { data_custo: 'desc' },
    });
    res.json(custos);
  } catch (err) {
    console.error('[ERRO] Listar custos:', err);
    res.status(500).json({ error: 'Erro ao buscar custos' });
  }
});

// POST /api/custos
app.post('/api/custos', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { clienteId, descricao, categoria, valor, data, status, comprovante, observacoes } = req.body;
    const numValor = parseFloat(valor?.toString().replace('R$', '').replace(/\./g, '').replace(',', '.') || 0);
    const novoCusto = await prisma.custoCliente.create({
      data: {
        id_cliente: parseInt(clienteId, 10),
        descricao,
        categoria,
        valor: numValor,
        data_custo: new Date(data),
        status: status || 'Pendente',
        comprovante,
        observacoes,
      },
      include: { cliente: { select: { razao_social: true, nome: true } } }
    });
    res.json(novoCusto);
  } catch (err) {
    console.error('[ERRO] Criar custo:', err);
    res.status(500).json({ error: 'Erro ao salvar custo' });
  }
});

// PUT /api/custos/:id
app.put('/api/custos/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const id = parseInt(req.params.id, 10);
    const { clienteId, descricao, categoria, valor, data, status, comprovante, observacoes } = req.body;
    const numValor = parseFloat(valor?.toString().replace('R$', '').replace(/\./g, '').replace(',', '.') || 0);
    
    const upCusto = await prisma.custoCliente.update({
      where: { id_custo: id },
      data: {
        id_cliente: parseInt(clienteId, 10),
        descricao, categoria,
        valor: numValor,
        data_custo: new Date(data),
        status, comprovante, observacoes,
      },
      include: { cliente: { select: { razao_social: true, nome: true } } }
    });
    res.json(upCusto);
  } catch (err) {
    console.error('[ERRO] Atualizar custo:', err);
    res.status(500).json({ error: 'Erro ao atualizar custo' });
  }
});

// DELETE /api/custos/:id
app.delete('/api/custos/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    await prisma.custoCliente.delete({ where: { id_custo: parseInt(req.params.id, 10) } });
    res.json({ success: true });
  } catch (err) {
    console.error('[ERRO] Deletar custo:', err);
    res.status(500).json({ error: 'Erro ao deletar custo' });
  }
});

// --- GET /api/admin/grupos --------------------------------------
app.get('/api/admin/grupos', (req, res) => {
  res.json(DEMO_USERS.map(u => ({
    grupo: u.grupo, nome: u.nome, cor: u.cor,
    modulos: u.modulos.map(m => m.codigo),
  })));
});

// --- Rotas Módulo Ponto e Apontamentos (Work) ------------------

// GET /api/ponto
app.get('/api/ponto', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const userId = parseInt(req.query.userId, 10);
    const dateQuery = req.query.date; // YYYY-MM-DD
    
    if (!userId || !dateQuery) return res.json([]);

    const start = new Date(`${dateQuery}T00:00:00.000Z`);
    const end = new Date(`${dateQuery}T23:59:59.999Z`);
    
    const pontos = await prisma.pontoRegistro.findMany({
      where: {
        id_usuario: userId,
        hora: { gte: start, lte: end }
      },
      orderBy: { hora: 'asc' }
    });
    
    res.json(pontos.map(p => ({
      id: p.id_registro,
      tipo: p.tipo,
      hora: p.hora.toISOString(),
      local: p.local
    })));
  } catch (err) {
    console.error('[ERRO] Listar ponto:', err);
    res.status(500).json({ error: 'Erro ao buscar ponto' });
  }
});

// POST /api/ponto
app.post('/api/ponto', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { userId, tipo, hora, local } = req.body;
    const novo = await prisma.pontoRegistro.create({
      data: {
        id_usuario: parseInt(userId, 10),
        tipo,
        hora: new Date(hora),
        local: local || 'HOME_OFFICE'
      }
    });
    res.json({
      id: novo.id_registro,
      tipo: novo.tipo,
      hora: novo.hora.toISOString(),
      local: novo.local
    });
  } catch (err) {
    console.error('[ERRO] Bater ponto:', err);
    res.status(500).json({ error: 'Erro ao bater ponto' });
  }
});

// ==========================================
// WORK: CLIENTES (para selects do módulo Work)
// ==========================================
app.get('/api/clientes', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: { id_cliente: true, nome: true, razao_social: true }
    });
    res.json(clientes.map(c => ({
      id: c.id_cliente,
      nome: c.nome || c.razao_social || `Cliente #${c.id_cliente}`
    })));
  } catch (err) {
    console.error('[ERRO] Listar clientes:', err);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// GET /api/apontamentos
app.get('/api/apontamentos', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const userId = parseInt(req.query.userId, 10);
    const dateQuery = req.query.date; // YYYY-MM-DD
    
    if (!userId || !dateQuery) return res.json([]);

    // Busca por range do dia completo (evita erros de timezone com coluna @db.Date)
    const start = new Date(`${dateQuery}T00:00:00.000Z`);
    const end   = new Date(`${dateQuery}T23:59:59.999Z`);
    
    const aponts = await prisma.apontamento.findMany({
      where: {
        id_usuario: userId,
        data_ref: { gte: start, lte: end }
      },
      include: { cliente: { select: { razao_social: true, nome: true } } },
      orderBy: { inicio: 'asc' }
    });
    
    res.json(aponts.map(a => ({
        id: a.id_apontamento,
        clienteId: a.id_cliente,
        projetoId: a.id_projeto,
        inicio: a.inicio,
        fim: a.fim,
        desc: a.descricao,
        tipo: a.tipo,
        totalMin: a.total_minutos,
        clienteNome: a.cliente.nome || a.cliente.razao_social || `Cliente #${a.id_cliente}`,
        clienteCor: '#6B7280', 
        projetoNome: a.id_projeto ? `Projeto #${a.id_projeto}` : 'Geral'
    })));
  } catch (err) {
    console.error('[ERRO] Listar apontamentos:', err);
    res.status(500).json({ error: 'Erro ao buscar apontamentos' });
  }
});

// POST /api/apontamentos
app.post('/api/apontamentos', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { userId, clienteId, projetoId, inicio, fim, desc, tipo, totalMin, data } = req.body;
    const novo = await prisma.apontamento.create({
      data: {
        id_usuario: parseInt(userId, 10),
        id_cliente: parseInt(clienteId, 10),
        id_projeto: projetoId ? parseInt(projetoId, 10) : null,
        inicio,
        fim,
        descricao: desc,
        tipo,
        total_minutos: parseInt(totalMin, 10),
        data_ref: new Date(`${data}T00:00:00.000Z`)
      }
    });
    res.json({ success: true, id: novo.id_apontamento });
  } catch (err) {
    console.error('[ERRO] Salvar apontamento:', err);
    res.status(500).json({ error: 'Erro ao salvar apontamento' });
  }
});

// DELETE /api/apontamentos/:id
app.delete('/api/apontamentos/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    await prisma.apontamento.delete({ where: { id_apontamento: parseInt(req.params.id, 10) } });
    res.json({ success: true });
  } catch (err) {
    console.error('[ERRO] Deletar apontamento:', err);
    res.status(500).json({ error: 'Erro ao deletar apontamento' });
  }
});

// PUT /api/apontamentos/:id (edição)
app.put('/api/apontamentos/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { clienteId, projetoId, inicio, fim, desc, tipo, totalMin } = req.body;
    const updated = await prisma.apontamento.update({
      where: { id_apontamento: parseInt(req.params.id, 10) },
      data: {
        id_cliente:    parseInt(clienteId, 10),
        id_projeto:    projetoId ? parseInt(projetoId, 10) : null,
        inicio,
        fim,
        total_minutos: parseInt(totalMin, 10),
        descricao:     desc,
        tipo
      }
    });
    res.json({ success: true, id: updated.id_apontamento });
  } catch (err) {
    console.error('[ERRO] Editar apontamento:', err);
    res.status(500).json({ error: 'Erro ao editar apontamento' });
  }
});

// ==========================================
// WORK: PROJETOS
// ==========================================
app.get('/api/projetos', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const projs = await prisma.projeto.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(projs.map(p => ({
      id: p.id_projeto,
      clienteId: p.id_cliente,
      nome: p.nome,
      status: p.status,
      permiteHE: p.permite_he,
      permiteBH: p.permite_bh,
      cor: p.cor
    })));
  } catch (err) {
    console.error('[ERRO] Listar projetos:', err);
    res.status(500).json({ error: 'Erro ao buscar projetos' });
  }
});

app.post('/api/projetos', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { clienteId, nome, status, permiteHE, permiteBH, cor } = req.body;
    if (!clienteId || !nome) return res.status(400).json({ error: 'clienteId e nome são obrigatórios' });
    const novo = await prisma.projeto.create({
      data: {
        id_cliente: parseInt(clienteId, 10),
        nome,
        status: status || 'ATIVO',
        permite_he: permiteHE === true || permiteHE === 'true',
        permite_bh: permiteBH === true || permiteBH === 'true',
        cor: cor || '#3A7BD5'
      }
    });
    res.json({ success: true, id: novo.id_projeto, nome: novo.nome });
  } catch (err) {
    console.error('[ERRO] Criar projeto:', err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
});

app.delete('/api/projetos/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    await prisma.projeto.delete({ where: { id_projeto: parseInt(req.params.id, 10) } });
    res.json({ success: true });
  } catch (err) {
    console.error('[ERRO] Deletar projeto:', err);
    res.status(500).json({ error: 'Erro ao deletar projeto' });
  }
});

// ==========================================
// WORK: EQUIPE E JORNADAS
// ==========================================
app.get('/api/equipe', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const configs = await prisma.colaboradorConfig.findMany({
      include: { usuario: true }
    });
    res.json(configs.map(c => ({
      id: c.id_usuario,
      nome: c.usuario.nome,
      cargo: c.cargo,
      tipo: c.tipo_vinculo,
      cor: c.cor_badge,
      jornada: c.jornada,
      he: c.tipo_vinculo === 'CLT',
      bh: true,
      horasMes: c.horas_mes,
      bhSaldo: Math.floor(c.saldo_bh_min / 60)
    })));
  } catch (err) {
    console.error('[ERRO] Listar equipe:', err);
    res.status(500).json({ error: 'Erro ao buscar equipe' });
  }
});

// ==========================================
// WORK: REEMBOLSOS
// ==========================================
app.get('/api/reembolsos', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const list = await prisma.reembolsoSolicitacao.findMany({
      include: { cliente: true, usuario: true, itens: true },
      orderBy: { criado_em: 'desc' }
    });
    res.json(list);
  } catch (err) {
    console.error('[ERRO] Listar reembolsos:', err);
    res.status(500).json({ error: 'Erro ao buscar reembolsos' });
  }
});

// ==========================================
// WORK: REUNIÕES
// ==========================================
app.get('/api/reunioes', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const list = await prisma.reuniao.findMany({
      include: { cliente: true, criador: true },
      orderBy: { data_hora: 'asc' }
    });
    res.json(list);
  } catch (err) {
    console.error('[ERRO] Listar reunioes:', err);
    res.status(500).json({ error: 'Erro ao buscar reunioes' });
  }
});

app.post('/api/reunioes', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { titulo, data_hora, duracao_m, link_meet, clienteId, projetoId, pauta, criadorId } = req.body;
    if (!titulo || !data_hora || !criadorId) return res.status(400).json({ error: 'titulo, data_hora e criadorId são obrigatórios' });
    const nova = await prisma.reuniao.create({
      data: {
        titulo,
        data_hora:  new Date(data_hora),
        duracao_m:  parseInt(duracao_m || 60, 10),
        link_meet:  link_meet || null,
        pauta:      pauta || null,
        id_cliente: clienteId ? parseInt(clienteId, 10) : null,
        id_projeto: projetoId ? parseInt(projetoId, 10) : null,
        criador_id: parseInt(criadorId, 10),
        status: 'AGENDADA'
      }
    });
    res.json({ success: true, id: nova.id_reuniao });
  } catch (err) {
    console.error('[ERRO] Criar reuniao:', err);
    res.status(500).json({ error: 'Erro ao criar reunião' });
  }
});

// PUT /api/reunioes/:id (edição)
app.put('/api/reunioes/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { titulo, data_hora, duracao_m, link_meet, clienteId, projetoId, pauta } = req.body;
    const updated = await prisma.reuniao.update({
      where: { id_reuniao: parseInt(req.params.id, 10) },
      data: {
        titulo,
        data_hora:  new Date(data_hora),
        duracao_m:  parseInt(duracao_m || 60, 10),
        link_meet:  link_meet || null,
        pauta:      pauta || null,
        id_cliente: clienteId ? parseInt(clienteId, 10) : null,
        id_projeto: projetoId ? parseInt(projetoId, 10) : null
      }
    });
    res.json({ success: true, id: updated.id_reuniao });
  } catch (err) {
    console.error('[ERRO] Editar reuniao:', err);
    res.status(500).json({ error: 'Erro ao editar reunião' });
  }
});

// ==========================================
// WORK: REEMBOLSOS
// ==========================================

app.post('/api/reembolsos', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { userId, clienteId, projetoId, periodo_ref, observacao, chave_pix, tipo_pix, banco, agencia, conta, tipo_conta, itens } = req.body;
    if (!userId || !clienteId || !periodo_ref) return res.status(400).json({ error: 'userId, clienteId e periodo_ref são obrigatórios' });
    const valor_total = (itens || []).reduce((acc, i) => acc + parseFloat(i.valor || 0), 0);
    const nova = await prisma.reembolsoSolicitacao.create({
      data: {
        id_usuario: parseInt(userId, 10),
        id_cliente: parseInt(clienteId, 10),
        id_projeto: projetoId ? parseInt(projetoId, 10) : null,
        periodo_ref,
        observacao: observacao || null,
        status: 'PENDENTE',
        valor_total,
        chave_pix: chave_pix || null,
        tipo_pix: tipo_pix || null,
        banco: banco || null,
        agencia: agencia || null,
        conta: conta || null,
        tipo_conta: tipo_conta || null,
        itens: {
          create: (itens || []).map(i => ({
            doc_fiscal: i.doc_fiscal || '-',
            fornecedor: i.fornecedor || '-',
            forma_pgto: i.forma_pgto || '-',
            valor: parseFloat(i.valor || 0),
            arquivo_url: i.arquivo_url || null
          }))
        }
      }
    });
    res.json({ success: true, id: nova.id_solicitacao });
  } catch (err) {
    console.error('[ERRO] Criar reembolso:', err);
    res.status(500).json({ error: 'Erro ao criar reembolso' });
  }
});

// ==========================================
// WORK: CUSTOS DE CLIENTE
// ==========================================
app.get('/api/custos', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const list = await prisma.custoCliente.findMany({
      include: { cliente: { select: { razao_social: true, nome: true } } },
      orderBy: { data_custo: 'desc' }
    });
    res.json(list);
  } catch (err) {
    console.error('[ERRO] Listar custos:', err);
    res.status(500).json({ error: 'Erro ao buscar custos' });
  }
});

app.post('/api/custos', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { id_cliente, descricao, categoria, valor, data_custo, status, comprovante, observacoes } = req.body;
    const novo = await prisma.custoCliente.create({ 
      data: {
        id_cliente: parseInt(id_cliente, 10),
        descricao,
        categoria,
        valor: parseFloat(valor),
        data_custo: new Date(data_custo),
        status, comprovante, observacoes
      }
    });
    res.json({ success: true, id: novo.id_custo });
  } catch (err) {
    console.error('[ERRO] Salvar custo:', err);
    res.status(500).json({ error: 'Erro ao salvar custo' });
  }
});

// --- Helpers ---------------------------------------------------
function extrairCampo(linhas, campo) {
  const linha = linhas.find(l => l.includes(`**${campo}**`));
  if (!linha) return null;
  const partes = linha.split('|');
  return partes.length >= 3 ? partes[2].trim() : null;
}

// ==========================================
// ADMIN: CLIENTES
// ==========================================
app.get('/api/admin/clientes', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const list = await prisma.cliente.findMany({ orderBy: { id_cliente: 'asc' } });
    res.json(list.map(c => ({
      id: c.id_cliente, razao_social: c.razao_social, nome: c.nome,
      cnpj: c.cnpj, segmento: c.segmento, ativo: c.ativo
    })));
  } catch(err) { res.status(500).json({ error: 'Erro ao listar clientes' }); }
});

app.get('/api/admin/clientes/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const c = await prisma.cliente.findUnique({ where: { id_cliente: parseInt(req.params.id, 10) } });
    if (!c) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ id: c.id_cliente, razao_social: c.razao_social, nome: c.nome, cnpj: c.cnpj, segmento: c.segmento });
  } catch(err) { res.status(500).json({ error: 'Erro ao buscar cliente' }); }
});

app.post('/api/admin/clientes', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { razao_social, nome, cnpj, segmento, ativo } = req.body;
    if (!razao_social) return res.status(400).json({ error: 'razao_social obrigatório' });
    const novo = await prisma.cliente.create({ data: { razao_social, nome: nome || razao_social, cnpj, segmento, ativo: ativo !== false } });
    res.json({ success: true, id: novo.id_cliente });
  } catch(err) { res.status(500).json({ error: 'Erro ao criar cliente' }); }
});

app.put('/api/admin/clientes/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { razao_social, nome, cnpj, segmento, ativo } = req.body;
    await prisma.cliente.update({
      where: { id_cliente: parseInt(req.params.id, 10) },
      data: { razao_social, nome, cnpj, segmento, ativo }
    });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: 'Erro ao atualizar cliente' }); }
});

app.delete('/api/admin/clientes/:id', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    await prisma.cliente.delete({ where: { id_cliente: parseInt(req.params.id, 10) } });
    res.json({ success: true });
  } catch(err) {
    console.error('[ERRO] Excluir cliente admin:', err);
    res.status(500).json({ error: 'Erro ao excluir cliente — verifique dependências' });
  }
});

// ==========================================
// ADMIN: USUÁRIOS
// ==========================================
app.get('/api/admin/usuarios', async (req, res) => {
  if (!prisma) return res.json([]);
  try {
    const list = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
    res.json(list.map(u => ({ id_usuario: u.id_usuario, nome: u.nome, email: u.email, grupo: u.grupo })));
  } catch(err) { res.status(500).json({ error: 'Erro ao listar usuários' }); }
});

app.put('/api/admin/usuarios/:id/grupo', async (req, res) => {
  if (!prisma) return res.status(503).json({ error: 'Banco indisponível' });
  try {
    const { grupo } = req.body;
    const grupos = ['ADMIN','SOCIO','GERENTE','CLT','PROFESSOR','ALUNO'];
    if (!grupos.includes(grupo)) return res.status(400).json({ error: 'Grupo inválido' });
    await prisma.usuario.update({ where: { id_usuario: parseInt(req.params.id, 10) }, data: { grupo } });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: 'Erro ao atualizar grupo' }); }
});

// --- Iniciar servidor ------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🌊 Overfloow Hub rodando em http://localhost:${PORT}`);
  console.log(`   Aulas em: ${AULAS_DIR}`);
  console.log(`   Login:    http://localhost:${PORT}/login\n`);
});
