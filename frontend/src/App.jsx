import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Tasks from './components/Tasks';
import Stats from './components/Stats';
import './App.css';

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => setIsAuth(true);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuth ? <Navigate to="/tasks" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={isAuth ? <Navigate to="/tasks" /> : <Register />} />
        <Route path="/tasks" element={isAuth ? <Tasks onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/stats" element={isAuth ? <Stats /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;