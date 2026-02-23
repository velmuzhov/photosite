// Components/Admin/AdminUpdateDescription.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventDetailAdmin, updateEventDescription } from '../../services/api';

const AdminUpdateDescription = () => {
  const { category, date } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Загрузка данных съёмки с описанием
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventDetailAdmin(category, date);
        setDescription(data.description || '');
        setOriginalDescription(data.description || '');
      } catch (error) {
        console.error('Не удалось загрузить описание съёмки:', error);
        setError('Не удалось загрузить информацию о съёмке');
      }
      setLoading(false);
    };
    fetchEvent();
  }, [category, date]);

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateEventDescription(category, date, description);
      setSuccess('Описание успешно обновлено');
      setOriginalDescription(description);
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении описания');
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="app-container p-4">
        <div className="d-flex justify-center">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container p-4">
      <h2>Обновление описания съёмки</h2>
      <p><strong>Категория:</strong> {category}</p>
      <p><strong>Дата:</strong> {date}</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSave} className="mt-4">
        <div className="mb-4">
          <label className="fw-bold mb-2">Описание съёмки</label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            rows="6"
            className="w-100"
            placeholder="Введите описание съёмки..."
          />
          <small className="text-muted">
            Текущее описание: {originalDescription || 'отсутствует'}
          </small>
        </div>

        <div className="flex-container gap-3">
          <button
            type="submit"
            disabled={isSaving || description === originalDescription}
            className={`btn ${
              isSaving || description === originalDescription
                ? 'bg-secondary'
                : 'bg-success'
            } text-light rounded`}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn bg-secondary text-light rounded"
          >
            Вернуться в админку
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUpdateDescription;
