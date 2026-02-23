// Components/Admin/Forms/DeleteDescriptionForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import {
  getEventDetailAdmin,
  deleteEventDescription,
} from '../../../services/api';

const DeleteDescriptionForm = () => {
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
      // Сначала получаем текущее описание для подтверждения
      const eventData = await getEventDetailAdmin(category, date);

      if (!eventData.description) {
        setError('У этой съёмки нет описания для удаления');
        setLoading(false);
        return;
      }

      // Подтверждение удаления — исправленный вариант
      const confirmDelete = window.confirm(
        `Вы уверены, что хотите удалить описание съёмки?\n\n` +
          `Категория: ${category}\nДата: ${date}\n\n` +
          `Текущее описание: "${eventData.description.substring(0, 100)}${eventData.description.length > 100 ? '...' : ''}"`,
      );

      if (!confirmDelete) {
        setLoading(false);
        return;
      }

      // Отправляем запрос на удаление
      await deleteEventDescription(category, date);
      setSuccess('Описание съёмки успешно удалено');
    } catch (err) {
      setError(err.message || 'Ошибка при удалении описания');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Удаление описания съёмки"
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

export default DeleteDescriptionForm;
