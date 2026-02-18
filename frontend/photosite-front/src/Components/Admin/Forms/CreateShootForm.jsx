import React, { useState } from 'react';
import BaseForm from './BaseForm';
import { createShoot } from '../../../services/api';

const CreateShootForm = () => {
  const [formData, setFormData] = useState({
    category: '',
    date: '',
    event_description: '',
  });
  const [files, setFiles] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleCoverChange = (e) => {
    setCoverFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('date', formData.date);
      if (formData.event_description) {
        data.append('event_description', formData.event_description);
      }
      data.append('event_cover', coverFile);

      files.forEach((file) => {
        data.append('files', file);
      });

      await createShoot(data);
      setSuccess('Съёмка успешно создана!');
      // Можно сбросить форму или перенаправить
    } catch (err) {
      setError(err.message || 'Ошибка при создании съёмки');
    }
    setLoading(false);
  };

  return (
    <BaseForm
      title="Создать съёмку"
      onSubmit={handleSubmit}
      cancelPath="/admin"
    >
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      
      <div className="grid-container gap-3 mt-3">
        <div>
          <label className="fw-bold">Категория</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
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
          <label className="fw-bold">Дата (ГГГГ-ММ-ДД)</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-100"
          />
        </div>

        <div>
          <label className="fw-bold">Описание</label>
          <textarea
            name="event_description"
            value={formData.event_description}
            onChange={handleChange}
            rows={3}
            className="w-100"
          />
        </div>

        <div>
          <label className="fw-bold">Обложка съёмки</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            required
            className="w-100"
          />
        </div>

        <div>
          <label className="fw-bold">Фотографии съёмки</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
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

export default CreateShootForm;
