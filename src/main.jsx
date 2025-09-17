import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App.jsx'; // Tu tablero Kanban
import LoginPage from './pages/LoginPage.jsx'; // Tu nueva página de Login
import './index.css';

// Aquí definimos las "páginas" de nuestra aplicación
const router = createBrowserRouter([
  {
    path: "/", // La ruta raíz (principal)
    element: <App />, // Muestra el tablero Kanban
  },
  {
    path: "/login", // La ruta para el login
    element: <LoginPage />, // Muestra la página de Login
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);