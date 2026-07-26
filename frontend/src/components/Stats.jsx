import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';
import './Stats.css';

const PRIORITY_COLORS = { alta: '#CF222E', media: '#BF8700', baja: '#1A7F37' };
const CATEGORIES = ['general', 'personal', 'trabajo', 'estudio', 'otro'];

function Stats() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const res = await api.get('/tasks', { params: { status: '' } });
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllTasks();
  }, []);

  if (loading) return <div className="stats-loading">Cargando estadísticas...</div>;

  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  const pieData = [
    { name: 'Completadas', value: completed },
    { name: 'Pendientes', value: pending }
  ];
  const PIE_COLORS = ['#1A7F37', '#D0D7DE'];

  const priorityData = ['alta', 'media', 'baja'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    total: tasks.filter(t => t.priority === p).length,
    fill: PRIORITY_COLORS[p]
  }));

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    total: tasks.filter(t => t.category === cat).length
  }));

  // Nuevo: tareas completadas por categoría
  const completedByCategory = CATEGORIES.map(cat => ({
    name: cat,
    completadas: tasks.filter(t => t.category === cat && t.completed).length
  }));

  return (
    <div className="stats-page">
      <h1>Estadísticas</h1>
      <p className="stats-benefits">
        Los gráficos te ayudan a <strong>visualizar tu avance</strong>, 
        <strong> medir el tiempo</strong> dedicado, 
        <strong> encontrar hábitos</strong> y <strong>mantener la motivación</strong>.
      </p>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Progreso general</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Tareas por prioridad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" name="Tareas">
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Tareas por categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#0969DA" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* NUEVO: Tareas completadas por categoría */}
        <div className="chart-card">
          <h3>Tareas completadas por categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completedByCategory}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completadas" fill="#1A7F37" name="Completadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Stats;