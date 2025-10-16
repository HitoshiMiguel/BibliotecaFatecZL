// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/authRoutes');
const dbTestRoute = require('./src/routes/dbTestRoute');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

// CORS / parsers
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ROTAS (sempre antes do 404/erros)
app.use('/api', authRoutes);
app.use('/db-test', dbTestRoute);
app.get('/__dbcheck', (req, res) => res.redirect(307, '/db-test'));

// 404 e erros (sempre por último)
app.use(notFound);
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API na porta ${PORT}`));
