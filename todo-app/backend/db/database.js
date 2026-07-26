// database.js
const initSqlJs = require('sql.js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isProduction = !!process.env.DATABASE_URL;
let db = null;
let pgPool = null;

// --- SQLite (local) ---
const DB_PATH = path.join(__dirname, 'todo.db');

async function getSQLiteDatabase() {
  if (db) return db;
  const SQL = await initSqlJs();
  let buffer;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
  }
  db = new SQL.Database(buffer);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.run(schema);
  saveSQLiteToDisk();
  return db;
}

function saveSQLiteToDisk() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function runAndSave(query, params = []) {
  db.run(query, params);
  saveSQLiteToDisk();
}

// --- PostgreSQL (producción) ---
async function getPostgreSQLPool() {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Render requiere SSL
    });
    // Crear tablas si no existen (esquema adaptado a PG)
    const schemaSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed INTEGER DEFAULT 0 CHECK(completed IN (0,1)),
      due_date TEXT DEFAULT NULL,
      priority TEXT DEFAULT 'media' CHECK(priority IN ('alta','media','baja')),
      category TEXT DEFAULT 'general',
      created_at TIMESTAMP DEFAULT NOW()
    );
    `;
    await pgPool.query(schemaSQL);
  }
  return pgPool;
}

// Función genérica para obtener base de datos (según entorno)
async function getDatabase() {
  if (isProduction) {
    return getPostgreSQLPool();
  } else {
    return getSQLiteDatabase();
  }
}

module.exports = { getDatabase, isProduction };