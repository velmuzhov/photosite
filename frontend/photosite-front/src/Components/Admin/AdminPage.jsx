import React from 'react';
import { Link } from 'react-router-dom';
import { clearCache } from '../../services/api';
import './AdminPage.css'; // Импортируем стили

const AdminPage = () => {
  return (
    <div className="app-container p-4 admin-page">
      <h1>Админка</h1>

      <div className="admin-buttons-container mt-4">
        <Link
          to="/admin/create-shoot"
          className="btn"
        >
          Создать съёмку
        </Link>

        <Link
          to="/admin/add-pictures"
          className="btn"
        >
          Добавить фотографии к съёмке
        </Link>

        <Link
          to="/admin/delete-pictures"
          className="btn"
        >
          Удалить фотографии из съёмки
        </Link>

        <Link
          to="/admin/update-description"
          className="btn"
        >
          Обновить описание съёмки
        </Link>

        <Link
          to="/admin/delete-description"
          className="btn"
        >
          Удалить описание съёмки
        </Link>

        {/* Новая ссылка для удаления съёмки */}
        <Link
          to="/admin/delete-event"
          className="btn"
        >
          Удалить съёмку
        </Link>

        <Link
          to="/admin/toggle-activity"
          className="btn"
        >
          Изменить активность съёмки
        </Link>

        <Link
          to="/admin/inactive-events"
          className="btn"
        >
          Показать неактивные съёмки
        </Link>

        <Link
          to="/admin/update-category-date"
          className="btn"
        >
          Обновить категорию и дату съёмки
        </Link>

        <Link
          to="/admin/update-cover"
          className="btn"
        >
          Обновить обложку съёмки
        </Link>

        <button
          onClick={async () => {
            try {
              await clearCache();
              alert('Кеш успешно очищен!');
            } catch (err) {
              alert(
                `Ошибка при очистке кеша: ${err.message || 'Неизвестная ошибка'}`,
              );
            }
          }}
          className="btn"
        >
          Очистить кеш
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
