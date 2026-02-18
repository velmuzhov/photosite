// EventCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, category }) => {
  // Форматируем дату в русскоязычном формате
  const date = new Date(event.date).toLocaleDateString('ru-RU');

  return (
    <Link to={`/events/${category}/${event.date}`} className="event-card d-block">
      <div className="event-card__image-container rounded-top overflow-hidden">
        <img
          src={`${import.meta.env.VITE_STATIC_BASE_URL}/images/${event.cover}`}
          alt={event.description || 'Обложка съёмки'}
          className="event-card__image w-100"
          loading="lazy"
        />
      </div>

      <div className="event-card__info p-3 bg-white rounded-bottom">
        <h3 className="event-card__date fs-small text-dark mb-0">{date}</h3>
        {event.description && (
          <p className="event-card__description text-muted fs-small mb-0">
            {event.description.length < 50
              ? event.description
              : event.description.slice(0, 47) + '...'}
          </p>
        )}
      </div>
    </Link>
  );
};

export default EventCard;
