import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para el mensaje de error

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Limpia el error anterior

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (response.ok) {
        alert('¡Login exitoso!');
    } else {
        setError(data.message); // Muestra el error del servidor
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input type="email" placeholder="Email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={styles.button}>Entrar</button>
        <p style={styles.linkText}>¿No tienes una cuenta? <Link to="/register">Regístrate</Link></p>
      </form>
    </div>
  );
}

// Estilos (incluyendo el nuevo estilo para el error)
const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' },
  form: { backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  input: { width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  linkText: { textAlign: 'center', marginTop: '16px' },
  error: { color: 'red', textAlign: 'center', marginBottom: '10px' }
};

export default LoginPage;