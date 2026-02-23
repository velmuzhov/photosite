// Components/Admin/Forms/UpdateCoverForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { editEventCover } from '../../../services/api';

const UpdateCoverForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [newCover, setNewCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!newCover) {
      setError('Пожалуйста, выберите файл обложки');
      setLoading(false);
      return;
    }

    try {
      await editEventCover(category, date, newCover);
      setSuccess('Обложка съёмки успешно обновлена!');
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении обложки съёмки');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Обновить обложку съёмки"
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

        <div>
          <label className="fw-bold">Новая обложка съёмки</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewCover(e.target.files[0])}
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
        {loading ? 'Обновление...' : 'Обновить обложку'}
      </button>

      {loading && (
        <div className="mt-4 flex-container justify-center">
          <div className="loader"></div>
        </div>
      )}
    </BaseForm>
  );
};

export default UpdateCoverForm;
