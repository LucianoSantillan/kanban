import React from 'react';
import { Outlet, Link } from 'react-router-dom';

// Estilos simples para la barra de navegación
const navStyles = {
  padding: '1rem',
  backgroundColor: '#f0f0f0',
  borderBottom: '1px solid #ddd',
  display: 'flex',
  gap: '1rem',
  fontFamily: 'sans-serif'
};

function App() {
  return (
    <div>
      <nav style={navStyles}>
        <Link to="/kanban">Tablero Kanban</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Registro</Link>
      </nav>

      <main>
        {/* Aquí es donde se renderizará la página actual (Kanban, Login, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}

export default App;