import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventDetail } from '../services/api';
import './EventDetail.css';

const EventPage = () => {
  const { category, date } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventDetail(category, date);
        setEvent(data);
      } catch (error) {
        console.error('Не удалось загрузить съёмку:', error);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [category, date]);

  if (loading) {
    return (
      <div className="event-page p-3">
        <div className="d-flex justify-center">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-page p-3">
        <p className="text-center text-muted">Съёмка не найдена.</p>
        <Link to="/" className="btn btn-primary mt-3 d-block w-fit mx-auto">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="event-page p-3">
      <Link
        to={`/${category}`}
        className="text-primary mb-3 d-inline-block"
      >
        ← Ко всем {category === 'wedding' ? 'свадьбам' : category === 'portrait' ? 'портретам' : 'семьям'}
      </Link>

      <h1 className="mb-4">{event.description || ''}</h1>

      {event.pictures && event.pictures.length > 0 && (
        <div className="images-grid mb-4">
          {event.pictures.map((img, index) => (
            <div key={index} className="image-item">
              <img
                src={`${import.meta.env.VITE_STATIC_BASE_URL}/images/${img.path}`}
                alt={`Фото ${index + 1}`}
                className="image-responsive"
              />
            </div>
          ))}
        </div>
      )}

      {event.description && (
        <div className="event-description bg-white p-4 rounded shadow mb-4">
          <p className="mb-0">{event.description}</p>
        </div>
      )}

      <Link to="/" className="btn btn-secondary">
        Вернуться на главную
      </Link>
    </div>
  );
};

export default EventPage;
