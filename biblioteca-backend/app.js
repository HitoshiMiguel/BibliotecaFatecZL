// app.js (substitua o seu por este)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// ================================
// Rotas / libs
// ================================
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const dbTestRoute = require('./src/routes/dbTestRoute');
const uploadRouter = require('./src/app/api/upload');
const googleRouter = require('./src/app/api/google');
const moderationRouter = require('./src/app/api/moderation');
const publicacoes = require('./src/app/api/publicacoes'); // monta /api/publicacoes
const pool = require('./src/config/db');
const acervoRoutes = require('./src/routes/acervoRoutes');
const reservasRoutes = require('./src/routes/reservasRoutes');
const reservasAdminRoutes = require('./src/routes/reservasAdminRoutes');
const avaliacaoRoutes = require('./src/routes/avaliacaoRoutes');
const favoritoRoutes = require('./src/routes/FavoritoRoutes');
const submissoesRoutes = require('./src/routes/submissoesRoutes');

const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const { isAuthenticated } = require('./src/middlewares/authMiddleware');
const iniciarAgendador = require('./src/services/cronScheduler');

const app = express();

// ================================
// Middlewares globais (coloca antes das rotas)
// ================================
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// pequeno logger (opcional)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ================================
// Rotas principais da API
// (registre aqui — ordem importa)
// ================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', isAuthenticated, uploadRouter);
app.use('/api/google', googleRouter);
app.use('/api/moderation', moderationRouter);

// Avaliações com prioridade
app.use('/api/publicacoes', avaliacaoRoutes);

// rota genérica de publicacoes (mantém compatibilidade)
app.use('/api', publicacoes);

app.use('/db-test', dbTestRoute);
app.use('/api/reservas', reservasRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/acervo', acervoRoutes);
app.use('/api/admin/reservas', reservasAdminRoutes);

// Submissoes: monta com prefix '/api/submissoes'
app.use('/api/submissoes', isAuthenticated, submissoesRoutes);

// ================================
// Healthcheck e diagnóstico
// ================================
app.get('/', (_req, res) => {
  res.json({ message: 'API da Biblioteca Rodando!' });
});

app.get('/__dbcheck', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ================================
// Scheduler (iniciar em background seguro)
// ================================
const { checkDueTodayAndOverdue } = require('./src/services/schedulers/reservaNotificationsScheduler');

// roda uma vez ao subir (sem bloquear startup)
checkDueTodayAndOverdue()
  .then(() => console.log('[Scheduler] Primeira execução concluída.'))
  .catch(err => console.error('[Scheduler] Erro inicial:', err));

// registra agendador periódico (em iniciarAgendador ou aqui)
iniciarAgendador && iniciarAgendador();

// ================================
// Handlers de erro (sempre por último)
// ================================
app.use(notFound);
app.use(errorHandler);

// ================================
// Debug helper: lista rotas registradas (seguro)
// ================================
function printRegisteredRoutes(appInstance) {
  try {
    console.log('--- ROTAS REGISTRADAS ---');
    if (!appInstance || !appInstance._router || !Array.isArray(appInstance._router.stack)) {
      console.log('(nenhuma rota encontrada no momento)');
      return;
    }
    const routes = [];
    appInstance._router.stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase()).join(',');
        routes.push(`${methods} ${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle && Array.isArray(layer.handle.stack)) {
        // router montado com prefix — percorre substack
        layer.handle.stack.forEach(inner => {
          if (inner.route && inner.route.path) {
            const methods = Object.keys(inner.route.methods || {}).map(m => m.toUpperCase()).join(',');
            // Para roteadores montados com prefix, o path mostrado será o interno (ex: /minhas)
            routes.push(`${methods} ${inner.route.path}`);
          }
        });
      }
    });
    routes.sort().forEach(r => console.log(r));
    console.log('--- FIM ROTAS ---');
  } catch (e) {
    console.warn('Falha ao listar rotas:', e && e.message ? e.message : e);
  }
}

// imprime rotas (útil durante dev)
printRegisteredRoutes(app);

// ================================
// Inicialização do servidor
// ================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API da Biblioteca rodando na porta ${PORT}`);
});
