import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Home from './Pages/Home';
import CategoryPage from './Pages/CategoryPage';

import About from './Pages/About';
import EventDetail from './Components/EventDetail';
import Login from './Pages/Login';
import Header from './Components/Header';
import './App.css';

const App = () => {
  // Здесь можно добавить проверку авторизации для админки
  const isAuthenticated = !!localStorage.getItem('authToken');

  const categories = [
    { path: 'wedding', title: 'Свадьбы' },
    { path: 'portrait', title: 'Портреты' },
    { path: 'family', title: 'Семья' },
  ];

  return (
    <Router>
      <Header />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Единый маршрут для всех категорий */}
          {categories.map(({ path, title }) => (
            <Route
              key={path}
              path={`/${path}`}
              element={<CategoryPage category={path} title={title} />}
            />
          ))}
          <Route path="/about" element={<About />} />

          <Route path="/events/:category/:date" element={<EventDetail />} />

          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <Login />}
          />

          {/* Заглушка для админки */}
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <div>Админка (пока заглушка)</div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
