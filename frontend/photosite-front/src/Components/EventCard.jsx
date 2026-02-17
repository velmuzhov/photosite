import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Lightbox from './Lightbox'; // Импорт лайтбокса
import './EventCard.css';

const EventCard = ({ event, category }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');

  // Форматируем дату
  const date = new Date(event.date).toLocaleDateString('ru-RU');

  // Открываем лайтбокс с выбранным фото
  const openLightbox = (imgPath) => {
    setCurrentImage(`${import.meta.env.VITE_STATIC_BASE_URL}/images/${imgPath}`);
    setIsLightboxOpen(true);
  };

  // Закрываем лайтбокс
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setCurrentImage('');
  };

  return (
    <div className="event-card-container">
      <Link to={`/events/${category}/${event.date}`} className="event-card d-block">
        {/* Обложка события (кликабельная) */}
        <div 
          className="event-card__image-container rounded-top overflow-hidden"
          onClick={() => openLightbox(event.cover)}
        >
          <img
            src={`${import.meta.env.VITE_STATIC_BASE_URL}/images/${event.cover}`}
            alt={event.description || 'Обложка съёмки'}
            className="event-card__image w-100"
            loading="lazy"
          />
        </div>

        {/* Информация о событии */}
        <div className="event-card__info p-3 bg-white rounded-bottom">
          <h3 className="event-card__date fs-small text-dark mb-0">{date}</h3>
          {event.description && (
            <p className="event-card__description text-muted fs-small mb-0">
              {event.description}
            </p>
          )}
        </div>
      </Link>

      {/* Лайтбокс для просмотра фото во весь экран */}
      {isLightboxOpen && (
        <Lightbox imageSrc={currentImage} onClose={closeLightbox} />
      )}
    </div>
  );
};

export default EventCard;
