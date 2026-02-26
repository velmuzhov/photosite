import React, { useEffect } from 'react';

const Lightbox = ({ imageSrc, onClose }) => {
  // Блокируем скролл страницы при открытии лайтбокса
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Обработчик нажатия клавиш
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Обработчик клика по оверлею (включая изображение)
  const handleOverlayClick = (e) => {
    // Закрываем только если клик был по самому оверлею ИЛИ по изображению
    if (
      e.target === e.currentTarget ||
      e.target.classList.contains('lightbox-image')
    ) {
      onClose();
    }
  };

  return (
    <div
      className="lightbox-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Закрыть лайтбокс"
        type="button"
      >
        ×
      </button>
      <img
        src={imageSrc}
        alt="Полноразмерное фото"
        className="lightbox-image"
        loading="lazy"
      />
    </div>
  );
};

export default Lightbox;
