const { getDatabase, isProduction } = require('./database');

// --- Helpers para manejar queries en SQLite y PG ---
async function executeQuery(queryOrFunction, params) {
  if (isProduction) {
    const pool = await getDatabase();
    const result = await pool.query(queryOrFunction, params);
    return result;
  } else {
    // En SQLite usamos db.run o db.prepare dentro de las funciones específicas
    // Se llamará a funciones adaptadas
    throw new Error('Modo SQLite no compatible con executeQuery genérico');
  }
}

// --- Usuarios ---
async function createUser(username, passwordHash) {
  if (isProduction) {
    const pool = await getDatabase();
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    );
  } else {
    const db = await getDatabase();
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
    const data = db.export();
    require('fs').writeFileSync(require('path').join(__dirname, 'todo.db'), Buffer.from(data));
  }
}

async function getUserByUsername(username) {
  if (isProduction) {
    const pool = await getDatabase();
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  } else {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

// --- Tareas ---
async function createTask(userId, title, description, dueDate, priority, category) {
  if (isProduction) {
    const pool = await getDatabase();
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, due_date, priority, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, title, description, dueDate || null, priority || 'media', category || 'general']
    );
    return result.rows[0].id;
  } else {
    const db = await getDatabase();
    db.run(
      'INSERT INTO tasks (user_id, title, description, due_date, priority, category) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, description, dueDate || null, priority || 'media', category || 'general']
    );
    const result = db.exec("SELECT last_insert_rowid() as id");
    return result[0].values[0][0];
  }
}

async function getTasksByUser(userId, filters = {}) {
  if (isProduction) {
    const pool = await getDatabase();
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (filters.status === 'active') {
      query += ' AND completed = 0';
    } else if (filters.status === 'completed') {
      query += ' AND completed = 1';
    }
    if (filters.priority) {
      query += ` AND priority = $${paramIndex++}`;
      params.push(filters.priority);
    }
    if (filters.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }
    if (filters.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
      const s = `%${filters.search}%`;
      params.push(s, s);
      paramIndex += 2;
    }

    query += ' ORDER BY completed ASC, priority ASC, due_date ASC, created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  } else {
    const db = await getDatabase();
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (filters.status === 'active') {
      query += ' AND completed = 0';
    } else if (filters.status === 'completed') {
      query += ' AND completed = 1';
    }
    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    query += ' ORDER BY completed ASC, priority ASC, due_date ASC, created_at DESC';
    const stmt = db.prepare(query);
    stmt.bind(params);
    const tasks = [];
    while (stmt.step()) {
      tasks.push(stmt.getAsObject());
    }
    stmt.free();
    return tasks;
  }
}

async function getTaskById(taskId, userId) {
  if (isProduction) {
    const pool = await getDatabase();
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    return result.rows[0] || null;
  } else {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?');
    stmt.bind([taskId, userId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

async function updateTask(taskId, userId, updates) {
  if (isProduction) {
    const pool = await getDatabase();
    const task = await getTaskById(taskId, userId);
    if (!task) return null;

    const title = updates.title !== undefined ? updates.title : task.title;
    const description = updates.description !== undefined ? updates.description : task.description;
    const completed = updates.completed !== undefined ? (updates.completed ? 1 : 0) : task.completed;
    const dueDate = updates.due_date !== undefined ? updates.due_date : task.due_date;
    const priority = updates.priority !== undefined ? updates.priority : task.priority;
    const category = updates.category !== undefined ? updates.category : task.category;

    await pool.query(
      `UPDATE tasks SET title=$1, description=$2, completed=$3, due_date=$4, priority=$5, category=$6
       WHERE id=$7 AND user_id=$8`,
      [title, description, completed, dueDate, priority, category, taskId, userId]
    );
    return getTaskById(taskId, userId);
  } else {
    const db = await getDatabase();
    const task = await getTaskById(taskId, userId);
    if (!task) return null;

    const title = updates.title !== undefined ? updates.title : task.title;
    const description = updates.description !== undefined ? updates.description : task.description;
    const completed = updates.completed !== undefined ? (updates.completed ? 1 : 0) : task.completed;
    const dueDate = updates.due_date !== undefined ? updates.due_date : task.due_date;
    const priority = updates.priority !== undefined ? updates.priority : task.priority;
    const category = updates.category !== undefined ? updates.category : task.category;

    db.run(
      `UPDATE tasks SET title=?, description=?, completed=?, due_date=?, priority=?, category=? WHERE id=? AND user_id=?`,
      [title, description, completed, dueDate, priority, category, taskId, userId]
    );
    const data = db.export();
    require('fs').writeFileSync(require('path').join(__dirname, 'todo.db'), Buffer.from(data));
    return getTaskById(taskId, userId);
  }
}

async function deleteTask(taskId, userId) {
  if (isProduction) {
    const pool = await getDatabase();
    await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  } else {
    const db = await getDatabase();
    db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    const data = db.export();
    require('fs').writeFileSync(require('path').join(__dirname, 'todo.db'), Buffer.from(data));
  }
}

async function countTasksByUser(userId) {
  if (isProduction) {
    const pool = await getDatabase();
    const result = await pool.query('SELECT COUNT(*) as total FROM tasks WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0].total);
  } else {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as total FROM tasks WHERE user_id = ?');
    stmt.bind([userId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row.total;
    }
    stmt.free();
    return 0;
  }
}

module.exports = {
  createUser,
  getUserByUsername,
  createTask,
  getTasksByUser,
  getTaskById,
  updateTask,
  deleteTask,
  countTasksByUser
};