const { getDatabase, runAndSave } = require('./database');

// Usuarios
async function createUser(username, passwordHash) {
  const db = await getDatabase();
  runAndSave('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
}

async function getUserByUsername(username) {
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

// Tareas
async function createTask(userId, title, description, dueDate, priority, category) {
  const db = await getDatabase();
  runAndSave(
    'INSERT INTO tasks (user_id, title, description, due_date, priority, category) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, title, description, dueDate || null, priority || 'media', category || 'general']
  );
  const result = db.exec("SELECT last_insert_rowid() as id");
  return result[0].values[0][0];
}

async function getTasksByUser(userId, filters = {}) {
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

async function getTaskById(taskId, userId) {
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

async function updateTask(taskId, userId, updates) {
  const db = await getDatabase();
  const task = await getTaskById(taskId, userId);
  if (!task) return null;

  const title = updates.title !== undefined ? updates.title : task.title;
  const description = updates.description !== undefined ? updates.description : task.description;
  const completed = updates.completed !== undefined ? (updates.completed ? 1 : 0) : task.completed;
  const dueDate = updates.due_date !== undefined ? updates.due_date : task.due_date;
  const priority = updates.priority !== undefined ? updates.priority : task.priority;
  const category = updates.category !== undefined ? updates.category : task.category;

  runAndSave(
    `UPDATE tasks SET title=?, description=?, completed=?, due_date=?, priority=?, category=? WHERE id=? AND user_id=?`,
    [title, description, completed, dueDate, priority, category, taskId, userId]
  );
  return getTaskById(taskId, userId);
}

async function deleteTask(taskId, userId) {
  const db = await getDatabase();
  runAndSave('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
}

async function countTasksByUser(userId) {
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