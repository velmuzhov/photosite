import React, { useState } from 'react';
import { login } from '../services/api';
import { setAuthToken } from '../services/api';
import './AuthForm.css';

const AuthForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(username, password);
      setAuthToken(data.access_token);
      onLogin && onLogin(data); // Передаём данные в родительский компонент
    } catch (err) {
      setError('Неверный логин или пароль');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Вход в админку</h2>
      {error && <p className="error-message">{error}</p>}
      
      <div className="form-group">
        <label htmlFor="username">Логин:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Пароль:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};

export default AuthForm;
