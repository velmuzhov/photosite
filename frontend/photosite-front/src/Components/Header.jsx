import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('authToken');


  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsMenuOpen(false);
  };

  return (
    <header className="header fixed-top w-100 bg-white shadow">
      <div className="container d-flex justify-between align-items-center p-3">
        <div className="header__logo">
          <Link to="/" className="nav-link">
            Главная
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
              <Link to="/family" className="nav-link">Семьи</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">Обо мне</Link>
            </li>

            {isAuthenticated ? (
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
            ) : (
              <li className="nav-item">
                <Link
                  to="/login"
                  className="nav-btn btn btn-sm btn-primary"
                >
                  Вход
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
