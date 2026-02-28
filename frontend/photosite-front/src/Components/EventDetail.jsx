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
  const [loadedImages, setLoadedImages] = useState(new Set());
  const imageRefs = useRef({});

  // Загрузка данных события
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventDetail(category, date);
        setEvent(data);
      } catch (error) {
        console.error('Не удалось загрузить съёмку:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [category, date]);

  // Обработчик загрузки изображения
  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  // Открытие лайтбокса — исправленная версия
  const openLightbox = (imgPath) => {
    setCurrentImageSrc(
      `${import.meta.env.VITE_BASE_FULLSIZE_PICTURES_URL}/${imgPath}`
    );
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  // Закрытие лайтбокса
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = '';
  };

  // Плавный скролл наверх
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

  useEffect(() => {
    // Очищаем память при размонтировании
    return () => {
      imageRefs.current = {};
    };
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <div className="event-page p-3">
          <div className="d-flex justify-center">
            <div className="loader"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-container">
        <div className="event-page p-3">
          <p className="text-center text-muted">Съёмка не найдена.</p>
          <Link to="/" className="btn btn-primary mt-3 d-block w-fit mx-auto">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="event-page" ref={containerRef}>
        {/* Кнопка «Наверх» */}
        <button
          className={`btn-to-top ${showBackToTop ? 'visible' : ''}`}
          onClick={scrollToTop}
          aria-label="Наверх"
        >
          ↑
        </button>

        {/* Дата съёмки */}
        <p className="text-muted fs-small mb-2">
          {event.date || date}
        </p>

        {/* Описание */}
        <h1 className="mb-4 fs-normal text-muted">{event.description || ''}</h1>

        {/* Галерея с соотношением 5:4 */}
        <div className="gallery-grid">
          {event.pictures?.map((img, index) => {
            const imageId = `image-${index}`;

            return (
              <div
                key={index}
                className="gallery-item ratio-5-4"
                onClick={() => openLightbox(img.path)}
              >
                <img
                  ref={(el) => { imageRefs.current[imageId] = el; }}
                  src={`${import.meta.env.VITE_BASE_THUMBNAILS_PICTURES_URL}/${img.path}`}
                  alt={`Фото ${index + 1}`}
                  className={`gallery-image ${loadedImages.has(imageId) ? 'loaded' : ''}`}
                  loading="lazy"
                  onLoad={() => handleImageLoad(imageId)}
                  onError={(e) => {
                    e.target.style.display = 'none';
            const parent = e.target.parentElement;
            parent.style.background = '#e0e0e0';
            parent.textContent = 'Ошибка загрузки';
            parent.style.color = '#666';
            parent.style.display = 'flex';
            parent.style.justifyContent = 'center';
            parent.style.alignItems = 'center';
            parent.style.fontSize = '14px';
          }}
                />
              </div>
            );
          })}
        </div>

        {/* Кнопки внизу страницы */}
        <div className="d-flex gap-md justify-center mt-lg">
          <Link
            to={`/${category}`}
            className="btn btn-secondary"
          >
            ← К{' '}
            {category === 'wedding'
              ? 'свадьбам'
              : category === 'portrait'
              ? 'портретам'
              : category === 'blog'
              ? 'блогу'
              : 'семейным'}
          </Link>
          <Link to="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>

        {/* Лайтбокс */}
        {isLightboxOpen && (
          <Lightbox
            imageSrc={currentImageSrc}
            onClose={closeLightbox}
          />
        )}
      </div>
    </div>
  );
};

export default EventPage;
