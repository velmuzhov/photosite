import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import './EventDetail.css';
import Lightbox from './Lightbox';
import { getEventDetail } from '../services/api';

const EventPage = () => {
  const { category, date } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const containerRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Загрузка данных события
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

  // Открытие лайтбокса
  const openLightbox = (imgPath) => {
    setCurrentImageSrc(
      `${import.meta.env.VITE_STATIC_BASE_URL}/images/${imgPath}`
    );
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Закрытие лайтбокса
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = '';
  };

  // Плавный скролл наверх (исправлено: скроллим window, а не контейнер)
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Отслеживание скролла для кнопки «Наверх»
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.pageYOffset > 200);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Проверка при загрузке
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="event-page" ref={containerRef}>
      {/* Кнопка «Наверх» */}
      <button
        className={`btn-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Наверх"
      >
        ↑
      </button>

      {/* Навигация */}
      <Link to={`/${category}`} className="text-primary mb-3 d-inline-block">
        ← Ко всем{' '}
        {category === 'wedding'
          ? 'свадьбам'
          : category === 'portrait'
          ? 'портретам'
          : 'семьям'}
      </Link>

      <h1 className="mb-4 fs-normal text-muted">{event.description || ''}</h1>

      {/* Галерея с соотношением 5:4 */}
      <div className="gallery-grid">
        {event.pictures?.map((img, index) => (
          <div
            key={index}
            className="gallery-item ratio-5-4"
            onClick={() => openLightbox(img.path)}
          >
            <img
              src={`${import.meta.env.VITE_STATIC_BASE_URL}/images/${img.path}`}
              alt={`Фото ${index + 1}`}
              className="gallery-image"
              loading="lazy"
            />
          </div>
        ))}
      </div>


      <Link to="/" className="btn btn-secondary">
        Вернуться на главную
      </Link>

      {/* Лайтбокс */}
      {isLightboxOpen && (
        <Lightbox
          imageSrc={currentImageSrc}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default EventPage;
