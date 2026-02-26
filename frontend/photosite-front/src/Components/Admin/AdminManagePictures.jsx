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
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const data = await getEventPicturesForAdmin(category, date);
        setEvent(data);
      } catch (error) {
        console.error('Не удалось загрузить съёмку:', error);
        setError('Не удалось загрузить фотографии съёмки. Проверьте подключение к сети.');
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
      setError(err.message || 'Ошибка при удалении фотографий. Попробуйте ещё раз.');
    }
    setLoading(false);
  };

  // Обработчик отмены выбора всех фотографий
  const handleClearSelection = () => {
    setSelectedPictures([]);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="app-container p-4">
        <div className="loader-container">
          <div className="loader" aria-label="Загрузка фотографий..."></div>
          <p className="loading-state">Загрузка фотографий...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-container p-4">
        <h2>Управление фотографиями съёмки</h2>
        <p className="text-center text-muted">Съёмка не найдена.</p>

        <div className="action-buttons">
          <button
            onClick={() => navigate('/admin')}
            className="btn btn-secondary rounded"
            aria-label="Вернуться в админку"
          >
            Вернуться в админку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container p-4">
      <h2>Управление фотографиями съёмки</h2>
      <p><strong>Категория:</strong> {category}</p>
      <p><strong>Дата:</strong> {date}</p>

      {error && (
        <div className="error-message" role="alert" aria-live="polite">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" role="status" aria-live="polite">
          {success}
        </div>
      )}

      <div className="action-buttons mb-4">
        <button
          onClick={handleDelete}
          disabled={selectedPictures.length === 0 || loading}
          className="btn btn-danger rounded"
          aria-label={`Удалить ${selectedPictures.length} выбранных фотографий`}
        >
          Удалить выбранные ({selectedPictures.length})
        </button>

        {selectedPictures.length > 0 && (
          <button
            onClick={handleClearSelection}
            className="btn btn-outline-secondary rounded"
            aria-label="Отменить выбор всех фотографий"
          >
            Отменить выбор
          </button>
        )}
      </div>

      <div className="gallery-grid">
        {event.pictures?.map((img) => (
          <div key={img.path} className="gallery-item ratio-5-4 position-relative">
            <input
              type="checkbox"
              checked={selectedPictures.includes(img.path)}
              onChange={() => handlePictureSelect(img.path)}
              className="delete-checkbox"
              aria-label={`Выбрать фото ${img.path} для удаления`}
            />
            <img
              src={`${import.meta.env.VITE_BASE_THUMBNAILS_PICTURES_URL}/${img.path}`}
              alt={`Фото ${img.path}`}
              className="gallery-image"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/images/placeholder.jpg';
                e.target.alt = 'Изображение недоступно';
              }}
            />
          </div>
        ))}
      </div>

      <div className="action-buttons mt-4">
        <button
          onClick={() => navigate('/admin')}
          className="btn btn-secondary rounded"
          aria-label="Вернуться в админку"
        >
          Вернуться в админку
        </button>
      </div>
    </div>
  );
};

export default AdminManagePictures;
