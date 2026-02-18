import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Проверяем авторизацию по правильному ключу
  const isAuthenticated = !!localStorage.getItem('access_token');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    // Удаляем токены
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Закрываем меню
    setIsMenuOpen(false);

    // Переходим на главную (или страницу входа)
    navigate('/', { replace: true });
  };

  // Перерендерим заголовок при изменении маршрута
  useEffect(() => {
    setIsMenuOpen(false); // Закрываем меню при смене страницы
  }, [location.pathname]);

  return (
    <header className="header fixed-top w-100 bg-white shadow">
      <div className="container d-flex justify-between align-items-center p-3">
        <div className="header__logo">
          <Link to="/" className="nav-link">
            Velmuzhov
          </Link>
        </div>

        <button
          className="burger-btn d-md-none"
          onClick={toggleMenu}
          aria-label="Открыть меню"
        >
          ☰
        </button>

        <nav className={`header__nav ${isMenuOpen ? 'show' : ''}`}>
          <ul className="nav-list d-flex flex-column flex-md-row align-items-stretch">
            <li className="nav-item">
              <Link to="/wedding" className="nav-link">Свадьбы</Link>
            </li>
            <li className="nav-item">
              <Link to="/portrait" className="nav-link">Портреты</Link>
            </li>
            <li className="nav-item">
              <Link to="/family" className="nav-link">Семья</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">Обо мне</Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link to="/admin" className="nav-link text-success">Админка</Link>
                </li>
                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    className="nav-btn btn btn-sm btn-outline-danger"
                  >
                    Выход
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
