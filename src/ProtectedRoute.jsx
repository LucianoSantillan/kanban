import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Revisa si el usuario tiene una "llave" de sesión guardada
  const isAuthenticated = localStorage.getItem('user-token');

  // Si no tiene la llave, lo redirige a la página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si tiene la llave, le permite ver el contenido (el tablero Kanban, que es el <Outlet>)
  return <Outlet />;
};

export default ProtectedRoute;