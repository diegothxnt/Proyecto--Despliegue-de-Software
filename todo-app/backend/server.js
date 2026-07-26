require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./db/database');

const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

getDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar la BD:', err);
});