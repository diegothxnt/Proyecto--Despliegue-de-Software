import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Tasks.css';
import PremiumModal from './PremiumModal';

const PRIORITY_COLORS = {
  alta: '#CF222E',
  media: '#BF8700',
  baja: '#1A7F37'
};

const CATEGORIES = ['general', 'personal', 'trabajo', 'estudio', 'otro'];

function Tasks({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('media');
  const [editCategory, setEditCategory] = useState('general');

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterPriority, searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // Validar formulario completo
  const isFormValid = () => {
    return title.trim() !== '' && desc.trim() !== '' && dueDate !== '' && priority !== '' && category !== '';
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setFormError('Por favor completa todos los campos para añadir la tarea.');
      return;
    }
    setFormError('');
    try {
      await api.post('/tasks', {
        title,
        description: desc,
        due_date: dueDate || null,
        priority,
        category
      });
      setTitle('');
      setDesc('');
      setDueDate('');
      setPriority('');
      setCategory('');
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 2000);
      fetchTasks();
    } catch (err) {
      if (err.response?.status === 403 && err.response.data.error === 'LIMIT_REACHED') {
        setShowPremiumModal(true);
      } else {
        alert('Error al crear tarea');
      }
    }
  };

  const handleToggle = async (task) => {
    try {
      await api.put(`/tasks/${task.id}`, { completed: task.completed ? 0 : 1 });
      fetchTasks();
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditDueDate(task.due_date || '');
    setEditPriority(task.priority);
    setEditCategory(task.category);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/tasks/${editingId}`, {
        title: editTitle,
        description: editDesc,
        due_date: editDueDate || null,
        priority: editPriority,
        category: editCategory
      });
      setEditingId(null);
      fetchTasks();
    } catch (err) {
      alert('Error al actualizar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">TaskFlow</div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
            <span>Todas</span>
            <span className="badge">{tasks.length}</span>
          </button>
          <button className={`nav-item ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>
            <span>Pendientes</span>
            <span className="badge">{tasks.filter(t => !t.completed).length}</span>
          </button>
          <button className={`nav-item ${filterStatus === 'completed' ? 'active' : ''}`} onClick={() => setFilterStatus('completed')}>
            <span>Completadas</span>
            <span className="badge">{completedCount}</span>
          </button>
          <Link to="/stats" className="nav-item">
            <span>Estadísticas</span>
          </Link>
        </nav>

        <div className="sidebar-section">
          <h4>Prioridad</h4>
          <div className="filter-chips">
            <button className={`chip ${filterPriority === '' ? 'active' : ''}`} onClick={() => setFilterPriority('')}>Todas</button>
            <button className={`chip ${filterPriority === 'alta' ? 'active' : ''}`} onClick={() => setFilterPriority('alta')}>
              <span className="priority-dot" style={{background: PRIORITY_COLORS.alta}}></span> Alta
            </button>
            <button className={`chip ${filterPriority === 'media' ? 'active' : ''}`} onClick={() => setFilterPriority('media')}>
              <span className="priority-dot" style={{background: PRIORITY_COLORS.media}}></span> Media
            </button>
            <button className={`chip ${filterPriority === 'baja' ? 'active' : ''}`} onClick={() => setFilterPriority('baja')}>
              <span className="priority-dot" style={{background: PRIORITY_COLORS.baja}}></span> Baja
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <small>{progress}% completado</small>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1>Mis tareas</h1>
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <form className="task-form" onSubmit={handleAdd}>
          <input
            className="main-input"
            placeholder="Título de la tarea *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="form-row">
            <input
              className="task-input desc-input"
              placeholder="Descripción *"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              required
            />
            <input
              type="date"
              className="task-input date-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
            />
            <select className="task-input select-input" value={priority} onChange={e => setPriority(e.target.value)} required>
              <option value="">Prioridad *</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <select className="task-input select-input" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Categoría *</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button type="submit" className="btn-add" disabled={!isFormValid() || loading}>
              Añadir tarea
            </button>
            {successMessage && <span className="success-check">&#10003; Tarea añadida</span>}
          </div>
        </form>

        {loading && <p className="info-msg">Cargando...</p>}
        {!loading && tasks.length === 0 && <p className="info-msg">No hay tareas. Crea una nueva.</p>}

        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className={`task-card ${task.completed ? 'done' : ''}`}>
              {editingId === task.id ? (
                <div className="edit-panel">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Título" />
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción" />
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="edit-actions">
                    <button onClick={handleUpdate} className="btn-save">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="btn-cancel">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="task-row">
                  <div className="task-left" onClick={() => handleToggle(task)}>
                    <div className={`checkbox ${task.completed ? 'checked' : ''}`}>
                      {task.completed && <span className="checkmark">&#10003;</span>}
                    </div>
                    <div className="task-info">
                      <span className="task-title">{task.title}</span>
                      {task.description && <p className="task-desc">{task.description}</p>}
                      <div className="task-meta">
                        {task.due_date && <span className="due-date">Fecha: {task.due_date}</span>}
                        <span className="priority-tag" style={{ background: PRIORITY_COLORS[task.priority] }}>
                          {task.priority}
                        </span>
                        <span className="category-tag">{task.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-right">
                    <button className="icon-btn" onClick={() => startEdit(task)} title="Editar">&#9998;</button>
                    <button className="icon-btn" onClick={() => handleDelete(task.id)} title="Eliminar">&#10005;</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </div>
  );
}

export default Tasks;