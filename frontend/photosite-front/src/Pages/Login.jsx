import React from 'react';
import AuthForm from '../Components/AuthForm';
import { useNavigate } from 'react-router-dom';
import './Login.css';


const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (data) => {
    // Сохраняем токен в localStorage
    localStorage.setItem('authToken', data.access_token);
    // Переходим в админку
    navigate('/admin');
  };

  return (
    <div className="login-page">
      <AuthForm onLogin={handleLogin} />
    </div>
  );
};

export default Login;
