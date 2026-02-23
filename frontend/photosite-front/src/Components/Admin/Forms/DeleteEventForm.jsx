// Components/Admin/Forms/DeleteEventForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { getEventDetailAdmin, deleteEvent } from '../../../services/api';

const DeleteEventForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Сначала получаем данные съёмки для подтверждения
      const eventData = await getEventDetailAdmin(category, date);

      // Подтверждение удаления
      const confirmDelete = window.confirm(
        `Вы уверены, что хотите удалить съёмку?\n\n` +
          `Категория: ${category}\nДата: ${date}\n\n` +
          `Описание: "${eventData.description?.substring(0, 100) || 'отсутствует'}${eventData.description && eventData.description.length > 100 ? '...' : ''}"`,
      );

      if (!confirmDelete) {
        setLoading(false);
        return;
      }

      // Отправляем запрос на удаление
      await deleteEvent(category, date);
      setSuccess(`Съёмка ${date} из категории ${category} успешно удалена`);
    } catch (err) {
      setError(err.message || 'Ошибка при удалении съёмки');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Удаление съёмки"
      onSubmit={handleSubmit}
      cancelPath="/admin"
    >
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

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

export default DeleteEventForm;
