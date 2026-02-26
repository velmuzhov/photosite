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

      // Явно сохраняем токен и проверяем
      setAuthToken(data.access_token);

      // Убедимся, что токен записан в localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Токен не сохранён');
      }

      // Вызываем родительский обработчик
      if (onLogin) {
        onLogin(data);
      }
    } catch (err) {
      setError('Неверный логин или пароль');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Вход в админку</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label htmlFor="username">Логин:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          className="form-control"
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
          disabled={loading}
          className="form-control"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-100">
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};

export default AuthForm;
