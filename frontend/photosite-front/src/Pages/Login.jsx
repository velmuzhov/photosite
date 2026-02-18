// src/Pages/Login.jsx
import React, { useEffect } from 'react';
import AuthForm from '../Components/AuthForm';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Целевой маршрут после входа (по умолчанию /admin)
  const from = location.state?.from || '/admin';

  // Проверка: если пользователь уже авторизован, перенаправляем сразу
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleLogin = (data) => {
    console.log('[Login] Авторизация успешна, переходим в админку');
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <AuthForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
