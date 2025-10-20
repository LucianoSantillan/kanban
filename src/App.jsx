import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // <--- 1. Importa el Toaster

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user-token'));

  useEffect(() => {
    const hasToken = !!localStorage.getItem('user-token');
    if (isAuthenticated !== hasToken) {
      setIsAuthenticated(hasToken);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('user-token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const navStyles = { padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd', display: 'flex', gap: '1rem', fontFamily: 'sans-serif', alignItems: 'center' };

  return (
    <div>
      {/* 2. Añade el componente Toaster aquí. Se encargará de mostrar todas las notificaciones. */}
      <Toaster position="top-center" reverseOrder={false} />

      <nav style={navStyles}>
        {isAuthenticated ? (
          <>
            <Link to="/kanban">Tablero Kanban</Link>
            <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Cerrar Sesión</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Registro</Link>
          </>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;