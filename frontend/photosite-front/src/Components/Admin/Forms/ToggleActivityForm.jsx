// Components/Admin/Forms/ToggleActivityForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { toggleEventActivity } from '../../../services/api';

const ToggleActivityForm = () => {
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
      // Отправляем запрос на изменение активности (toggle)
      await toggleEventActivity(category, date);
      setSuccess(`Активность съёмки ${date} из категории ${category} успешно изменена`);
    } catch (err) {
      setError(err.message || 'Ошибка при изменении активности съёмки');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Изменение активности съёмки"
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

      <button
        type="submit"
        disabled={loading}
        className="btn bg-primary text-light rounded mt-4"
      >
        {loading ? 'Изменение...' : 'Изменить активность съёмки'}
      </button>

      {loading && (
        <div className="mt-4 flex-container justify-center">
          <div className="loader"></div>
        </div>
      )}
    </BaseForm>
  );
};

export default ToggleActivityForm;
