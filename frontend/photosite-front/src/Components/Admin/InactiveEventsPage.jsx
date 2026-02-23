// Components/Admin/InactiveEventsPage.jsx
import React, { useState, useEffect } from 'react';
import { toggleEventActivity, getInactiveEvents } from '../../services/api';

const InactiveEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const PICTURES_BASE_URL = import.meta.env.VITE_BASE_PICTURES_URL;

  // Загрузка неактивных съёмок при монтировании компонента
  useEffect(() => {
    loadInactiveEvents();
  }, []);

  const loadInactiveEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const inactiveEvents = await getInactiveEvents();
      setEvents(inactiveEvents);
      console.log(inactiveEvents);
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке неактивных съёмок');
    }
    setLoading(false);
  };

  const handleMakeActive = async (category, date) => {
    try {
      await toggleEventActivity(category, date);
      // После успешного переключения перезагружаем список
      await loadInactiveEvents();
    } catch (err) {
      setError(err.message || 'Ошибка при активации съёмки');
    }
  };

  if (loading) {
    return (
      <div className="app-container p-4">
        <h1>Неактивные съёмки</h1>
        <div className="flex-container justify-center mt-4">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container p-4">
      <h1>Неактивные съёмки</h1>

      {error && <div className="error-message">{error}</div>}

      {events.length === 0 ? (
        <div className="text-center mt-4">
          <p>Нет неактивных съёмок</p>
        </div>
      ) : (
        <div className="grid-container gap-3 mt-3">
            {console.log(events)}
          {events.map((event) => (
            <div key={`${event.category.name}-${event.date}`} className="card">
              <div className="mb-3">
                <img
                  src={`${PICTURES_BASE_URL}${event.cover}`}
                  alt={`Обложка съёмки ${event.date}`}
                  className="w-100 rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <h3 className="fs-large">{event.category.name}</h3>
              <p className="text-muted">Дата: {event.date}</p>
              <button
                onClick={() => handleMakeActive(event.category.name, event.date)}
                className="btn bg-success text-light rounded w-100"
              >
                Сделать активной
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InactiveEventsPage;
