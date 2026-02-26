// EventCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, category }) => {
  // Форматируем дату в русскоязычном формате
  const date = new Date(event.date).toLocaleDateString('ru-RU');

  return (
    <Link to={`/events/${category}/${event.date}`} className="event-card d-block">
      <div className="event-card__image-wrapper">
        <img
          src={`${import.meta.env.VITE_STATIC_BASE_URL}/images/${event.cover}`}
          alt={event.description || 'Обложка съёмки'}
          className="event-card__image"
          loading="lazy"
        />
      </div>

      <div className="event-card__info">
        <h3 className="event-card__date">{date}</h3>
        {event.description && (
          <p className="event-card__description">
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
