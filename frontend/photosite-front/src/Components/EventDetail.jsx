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
  const savedScrollPosition = useRef({ x: 0, y: 0 }); // Сохраняем позицию прокрутки
  const isHandlingPopstate = useRef(false); // Флаг для защиты от рекурсии

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

  // Открытие лайтбокса с сохранением позиции прокрутки
  const openLightbox = (imgPath) => {
    // Сохраняем текущую позицию прокрутки перед блокировкой
    savedScrollPosition.current = {
      x: window.pageXOffset,
      y: window.pageYOffset
    };

    setCurrentImageSrc(
      `${import.meta.env.VITE_BASE_FULLSIZE_PICTURES_URL}/${imgPath}`
    );
    setIsLightboxOpen(true);

    // Блокируем скролл
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollPosition.current.y}px`;
    document.body.style.left = `-${savedScrollPosition.current.x}px`;
    document.body.style.width = '100%';

    // Добавляем запись в историю с флагом лайтбокса
    window.history.pushState({ isLightbox: true }, '', window.location.href);
  };

  // Закрытие лайтбокса с восстановлением позиции
  // с помощью кнопки Назад
  const closeLightboxBack = () => {
    setIsLightboxOpen(false);
    // Восстанавливаем скролл и позицию
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    window.scrollTo(savedScrollPosition.current.x, savedScrollPosition.current.y);

    // Заменяем текущую запись истории без флага лайтбокса
    window.history.replaceState({}, '', window.location.href);
    // window.history.back();
  };

  // Закрытие лайтбокса с восстановлением позиции
  // всеми остальными способами
  // (не кнопкой Назад)
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    // Восстанавливаем скролл и позицию
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    window.scrollTo(savedScrollPosition.current.x, savedScrollPosition.current.y);

    // Переход на 1 шаг назад
    // window.history.replaceState({}, '', window.location.href);
    window.history.back();
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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Перехват кнопки «Назад» при открытом лайтбоксе
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handlePopState = (event) => {
      if (isHandlingPopstate.current) return;

      isHandlingPopstate.current = true;
      event.preventDefault();
      closeLightboxBack();

      setTimeout(() => {
        isHandlingPopstate.current = false;
      }, 100); // Сброс флага через 100 мс
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLightboxOpen]);

  // Обработка Escape
  // useEffect(() => {
  //   if (isLightboxOpen) {
  //     const handleKeyDown = (event) => {
  //       if (event.key === 'Escape') {
  //         closeLightbox();
  //       }
  //     };
  //     window.addEventListener('keydown', handleKeyDown);
  //     return () => window.removeEventListener('keydown', handleKeyDown);
  //   }
  // }, [isLightboxOpen]);

  useEffect(() => {
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
                  onContextMenu={(e) => e.preventDefault()}
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
