// Pages/AdminManagePictures.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminManagePictures.css';
import { getEventPicturesForAdmin, deletePictures } from '../../services/api';

const AdminManagePictures = () => {
  const { category, date } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [selectedPictures, setSelectedPictures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Загрузка данных съёмки
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventPicturesForAdmin(category, date);
        setEvent(data);
      } catch (error) {
        console.error('Не удалось загрузить съёмку:', error);
        setError('Не удалось загрузить фотографии съёмки');
      }
      setLoading(false);
    };
    fetchEvent();
  }, [category, date]);

  // Обработчик выбора фотографий
  const handlePictureSelect = (picturePath) => {
    setSelectedPictures(prev =>
      prev.includes(picturePath)
        ? prev.filter(path => path !== picturePath)
        : [...prev, picturePath]
    );
  };

  // Обработка удаления выбранных фотографий
  const handleDelete = async () => {
    if (selectedPictures.length === 0) {
      setError('Выберите хотя бы одну фотографию для удаления');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await deletePictures(selectedPictures);
      setSuccess(`Удалено ${selectedPictures.length} фотографий`);
      setSelectedPictures([]); // Сбрасываем выбор

      // Обновляем данные
      const updatedEvent = await getEventPicturesForAdmin(category, date);
      setEvent(updatedEvent);
    } catch (err) {
      setError(err.message || 'Ошибка при удалении фотографий');
    }
    setLoading(false);
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

  if (!event) {
    return (
      <div className="app-container p-4">
        <p className="text-center text-muted">Съёмка не найдена.</p>
        <button
          onClick={() => navigate('/admin')}
          className="btn bg-secondary text-light rounded"
        >
          Вернуться в админку
        </button>
      </div>
    );
  }

  return (
    <div className="app-container p-4">
      <h2>Управление фотографиями съёмки</h2>
      <p><strong>Категория:</strong> {category}</p>
      <p><strong>Дата:</strong> {date}</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <button
        onClick={handleDelete}
        disabled={selectedPictures.length === 0 || loading}
        className="btn bg-danger text-light rounded mb-4"
      >
        Удалить выбранные ({selectedPictures.length})
      </button>

      <div className="gallery-grid">
        {event.pictures?.map((img) => (
          <div key={img.path} className="gallery-item ratio-5-4 position-relative">
            <input
              type="checkbox"
              checked={selectedPictures.includes(img.path)}
              onChange={() => handlePictureSelect(img.path)}
              className="delete-checkbox"
            />
            <img
              src={`${import.meta.env.VITE_BASE_THUMBNAILS_PICTURES_URL}/${img.path}`}
              alt={`Фото ${img.path}`}
              className="gallery-image"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/admin')}
        className="btn bg-secondary text-light rounded mt-4"
      >
        Вернуться в админку
      </button>
    </div>
  );
};

export default AdminManagePictures;
