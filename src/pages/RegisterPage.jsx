// src/pages/RegisterPage.jsx
import React from 'react';
// 1. Importamos 'Link' junto a 'useNavigate'
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function RegisterPage() {
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (!email || !password) {
      return toast.error('Por favor, completa todos los campos.');
    }

    const loadingToast = toast.loading('Registrando...');

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Registro exitoso! Redirigiendo al login...', { id: loadingToast });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        toast.error(data.message || 'Error en el registro.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('No se pudo conectar con el servidor.', { id: loadingToast });
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Registrarse</h2>
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Contraseña" />
        <button type="submit">Crear Cuenta</button>
        <p>
          ¿Ya tienes una cuenta?{' '}
          {/* 2. Reemplazamos <a> por <Link> y href por to */}
          <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;