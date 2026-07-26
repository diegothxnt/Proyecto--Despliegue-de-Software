import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // Validación continua de la contraseña
  const validatePassword = (value) => {
    if (value.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
    } else if (/\s/.test(value)) {
      setPasswordError('La contraseña no puede contener espacios');
    } else {
      setPasswordError('');
    }
    setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación final antes de enviar
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (/\s/.test(password)) {
      setError('La contraseña no puede contener espacios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { username, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">TaskFlow</div>
        <h2>Crear cuenta</h2>
        <p className="auth-sub">Empieza a organizar tus tareas</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}

          <div className="field">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Elige un nombre"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Al menos 6 caracteres, sin espacios"
              value={password}
              onChange={e => validatePassword(e.target.value)}
              required
            />
            {passwordError && <div className="field-error">{passwordError}</div>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !!passwordError}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>

          <p className="auth-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;