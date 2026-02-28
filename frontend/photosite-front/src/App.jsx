import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Home from './Pages/Home';
import CategoryPage from './Pages/CategoryPage';
import AdminPage from './Components/Admin/AdminPage';
import CreateShootForm from './Components/Admin/Forms/CreateShootForm';
import AddPicturesForm from './Components/Admin/Forms/AddPicturesForm';
import DeletePicturesForm from './Components/Admin/Forms/DeletePicturesForm';
import AdminManagePictures from './Components/Admin/AdminManagePictures';
import UpdateDescriptionForm from './Components/Admin/Forms/UpdateDescriptionForm';
import AdminUpdateDescription from './Components/Admin/AdminUpdateDescription';
import DeleteDescriptionForm from './Components/Admin/Forms/DeleteDescriptionForm';
import DeleteEventForm from './Components/Admin/Forms/DeleteEventForm';
import ToggleActivityForm from './Components/Admin/Forms/ToggleActivityForm';
import InactiveEventsPage from './Components/Admin/InactiveEventsPage';
import UpdateCategoryAndDateForm from './Components/Admin/Forms/UpdateCategoryAndDateForm';
import UpdateCoverForm from './Components/Admin/Forms/UpdateCoverForm';

import About from './Pages/About';
import EventDetail from './Components/EventDetail';
import Login from './Pages/Login';
import Header from './Components/Header';
import ScrollToTop from './Components/ScrollToTop';
import './App.css';

const App = () => {
  // Используем правильный ключ из services/api.js
  const isAuthenticated = !!localStorage.getItem('access_token');

  const categories = [
    { path: 'wedding', title: 'Свадьбы' },
    { path: 'portrait', title: 'Портреты' },
    { path: 'family', title: 'Семья' },
    { path: 'blog', title: 'Блог'},
  ];

  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      // Нет токена → на страницу входа
      return (
        <Navigate
          to="/login"
          state={{ from: window.location.pathname }}
          replace
        />
      );
    }

    // Есть токен → показываем контент
    return children;
  };

  return (
    <Router>
      <ScrollToTop />
      <Header />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          {categories.map(({ path, title }) => (
            <Route
              key={path}
              path={`/${path}`}
              element={<CategoryPage category={path} title={title} />}
            />
          ))}
          <Route path="/about" element={<About />} />
          <Route path="/events/:category/:date" element={<EventDetail />} />

          {/* Страница входа — только если НЕ авторизован */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/admin" /> : <Login />}
          />

          {/* Админка — только для авторизованных */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/create-shoot"
            element={
              <PrivateRoute>
                <CreateShootForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/add-pictures"
            element={
              <PrivateRoute>
                <AddPicturesForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/delete-pictures"
            element={
              <PrivateRoute>
                <DeletePicturesForm />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/manage-pictures/:category/:date"
            element={
              <PrivateRoute>
                <AdminManagePictures />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/update-description"
            element={
              <PrivateRoute>
                <UpdateDescriptionForm />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/update-description/:category/:date"
            element={
              <PrivateRoute>
                <AdminUpdateDescription />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/delete-description"
            element={
              <PrivateRoute>
                <DeleteDescriptionForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/delete-event"
            element={
              <PrivateRoute>
                <DeleteEventForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/toggle-activity"
            element={
              <PrivateRoute>
                <ToggleActivityForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/inactive-events"
            element={
              <PrivateRoute>
                <InactiveEventsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/update-category-date"
            element={
              <PrivateRoute>
                <UpdateCategoryAndDateForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/update-cover"
            element={
              <PrivateRoute>
                <UpdateCoverForm />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
