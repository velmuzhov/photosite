// Components/Admin/AdminPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  return (
    <div className="app-container p-4">
      <h1>Админка</h1>

      <div className="flex-container mt-4 gap-3">
        <Link
          to="/admin/create-shoot"
          className="btn bg-primary text-light rounded"
        >
          Создать съёмку
        </Link>

        <Link
          to="/admin/add-pictures"
          className="btn bg-secondary text-light rounded"
        >
          Добавить фотографии к съёмке
        </Link>

        <Link
          to="/admin/delete-pictures"
          className="btn bg-danger text-light rounded"
        >
          Удалить фотографии из съёмки
        </Link>

        <Link
          to="/admin/update-description"
          className="btn bg-warning text-dark rounded"
        >
          Обновить описание съёмки
        </Link>

        <Link
          to="/admin/delete-description"
          className="btn bg-dark text-light rounded"
        >
          Удалить описание съёмки
        </Link>

        {/* Новая ссылка для удаления съёмки */}
        <Link
          to="/admin/delete-event"
          className="btn bg-danger text-light rounded"
        >
          Удалить съёмку
        </Link>
      </div>
    </div>
  );
};

export default AdminPage;
