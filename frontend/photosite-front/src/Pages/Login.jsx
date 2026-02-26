import React, { useEffect, useState } from 'react';
import AuthForm from '../Components/AuthForm';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState(null);

  // Целевой маршрут после входа (по умолчанию /admin)
  const from = location.state?.from || '/admin';

  // Проверка: если пользователь уже авторизован, перенаправляем сразу
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleLogin = async (data) => {
    try {
      // Здесь должна быть реальная логика авторизации
      console.log('[Login] Попытка авторизации...', data);

      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Сохранение токена (в реальном приложении — после успешного ответа сервера)
      localStorage.setItem('access_token', 'mock-token');

      console.log('[Login] Авторизация успешна, переходим в админку');
      setStatus({ type: 'success', message: 'Успешный вход! Перенаправление...' });

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (error) {
      console.error('[Login] Ошибка авторизации:', error);
      setStatus({
        type: 'error',
        message: 'Не удалось войти. Проверьте логин и пароль.'
      });
    }
  };

  const handleCloseStatus = () => {
    setStatus(null);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Вход в систему</h1>

        {status && (
          <div
            className={`login-status ${status.type}`}
            onClick={handleCloseStatus}
            role="alert"
            aria-live="polite"
          >
            {status.message}
          </div>
        )}

        <AuthForm
          onLogin={handleLogin}
          initialData={{
            email: '',
            password: ''
          }}
        />
      </div>
    </div>
  );
};

export default Login;
