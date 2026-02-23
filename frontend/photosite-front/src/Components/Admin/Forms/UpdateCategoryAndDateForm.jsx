// Components/Admin/Forms/UpdateCategoryAndDateForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { editEventBaseData } from '../../../services/api';

const UpdateCategoryAndDateForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await editEventBaseData(category, date, newCategory, newDate);
      setSuccess('Категория и дата съёмки успешно обновлены!');
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении категории и даты съёмки');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Обновить категорию и дату съёмки"
      onSubmit={handleSubmit}
      cancelPath="/admin"
    >
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="grid-container gap-3 mt-3">
        <div>
          <label className="fw-bold">Текущая категория</label>
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
          <label className="fw-bold">Текущая дата съёмки (ГГГГ-ММ-ДД)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-100"
          />
        </div>

        <div>
          <label className="fw-bold">Новая категория</label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-100"
          >
            <option value="">Не менять</option>
            <option value="wedding">Свадьба</option>
            <option value="portrait">Портрет</option>
            <option value="family">Семья</option>
          </select>
        </div>

        <div>
          <label className="fw-bold">Новая дата съёмки (ГГГГ-ММ-ДД)</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn bg-primary text-light rounded mt-4"
      >
        {loading ? 'Обновление...' : 'Обновить категорию и дату'}
      </button>

      {loading && (
        <div className="mt-4 flex-container justify-center">
          <div className="loader"></div>
        </div>
      )}
    </BaseForm>
  );
};

export default UpdateCategoryAndDateForm;
