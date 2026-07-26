const express = require('express');
const authMiddleware = require('../middleware/auth');
const queries = require('../db/queries');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      search: req.query.search
    };
    const tasks = await queries.getTasksByUser(req.userId, filters);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, due_date, priority, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    // Límite de 10 tareas gratuitas
    const count = await queries.countTasksByUser(req.userId);
    if (count >= 10) {
      return res.status(403).json({
        error: 'LIMIT_REACHED',
        message: 'Has alcanzado el límite de 10 tareas gratuitas. Actualízate a Premium.'
      });
    }

    const newTaskId = await queries.createTask(req.userId, title, description, due_date, priority, category);
    const newTask = await queries.getTaskById(newTaskId, req.userId);
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await queries.updateTask(req.params.id, req.userId, req.body);
    if (!updated) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await queries.getTaskById(req.params.id, req.userId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    await queries.deleteTask(req.params.id, req.userId);
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;