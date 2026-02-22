// Components/Admin/Forms/DeletePicturesForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { getEventPicturesForAdmin } from '../../../services/api';

const DeletePicturesForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await getEventPicturesForAdmin(category, date);
      // Переходим на страницу с галереей и чекбоксами
      window.location.href = `/admin/manage-pictures/${category}/${date}`;
    } catch (err) {
      setError(err.message || 'Ошибка при получении информации о съёмке');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Удалить фотографии из съёмки"
      onSubmit={handleSubmit}
      cancelPath="/admin"
    >
      {error && <div className="error-message">{error}</div>}

      <div className="grid-container gap-3 mt-3">
        <div>
          <label className="fw-bold">Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-100"
          >
            <option value="">Выберите категорию</option>
            <option value="wedding">Свадьба</option>
            <option value="portrait">Портрет</option>
            <option value="family">Семья</option>
          </select>
        </div>

        <div>
          <label className="fw-bold">Дата съёмки (ГГГГ-ММ-ДД)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-100"
          />
        </div>
      </div>

      {loading && (
        <div className="mt-4 flex-container justify-center">
          <div className="loader"></div>
        </div>
      )}
    </BaseForm>
  );
};

export default DeletePicturesForm;
