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

  // Закрываем меню при смене страницы
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Обработчик клика по пункту меню
  const handleMenuItemClick = () => {
    if (window.innerWidth < 768) {
      // Закрываем меню только на мобильных устройствах
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="header fixed-top w-100 bg-white shadow">
      <div className="container d-flex justify-between align-items-center p-3">
        <div className="header__logo">
          <Link to="/" className="nav-link" onClick={handleMenuItemClick}>
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
          <ul className="nav-list">
            <li className="nav-item">
              <Link
                to="/wedding"
                className={`nav-link ${location.pathname === '/wedding' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Свадьбы
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/portrait"
                className={`nav-link ${location.pathname === '/portrait' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Портреты
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/family"
                className={`nav-link ${location.pathname === '/family' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Семья
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Обо мне
              </Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link
                    to="/admin"
            className={`nav-link text-success ${location.pathname === '/admin' ? 'active' : ''}`}
            onClick={handleMenuItemClick}
          >
            Админка
          </Link>
        </li>
        <li className="nav-item">
          <button
            onClick={handleLogout}
            className="nav-btn"
            aria-label="Выход из аккаунта"
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
