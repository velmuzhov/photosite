// Components/Admin/Forms/AddPicturesForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { addPicturesToExistingEvent } from '../../../services/api';

const AddPicturesForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addPicturesToExistingEvent(category, date, files);
      setSuccess('Фотографии успешно добавлены!');
    } catch (err) {
      setError(err.message || 'Ошибка при добавлении фотографий');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Добавить фотографии к съёмке"
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
          <label className="fw-bold">Фотографии для загрузки</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
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

export default AddPicturesForm;
