// Components/Admin/AdminPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { clearCache } from '../../services/api';

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
        <Link
          to="/admin/toggle-activity"
          className="btn bg-info text-light rounded"
        >
          Изменить активность съёмки
        </Link>
        <Link
          to="/admin/inactive-events"
          className="btn bg-info text-light rounded"
        >
          Показать неактивные съёмки
        </Link>
        <Link
          to="/admin/update-category-date"
          className="btn bg-warning text-dark rounded"
        >
          Обновить категорию и дату съёмки
        </Link>
        <Link
          to="/admin/update-cover"
          className="btn bg-success text-light rounded"
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
          className="btn bg-danger text-light rounded"
        >
          Очистить кеш
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
