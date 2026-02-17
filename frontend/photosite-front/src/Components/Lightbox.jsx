import React, { useEffect } from 'react';

const Lightbox = ({ imageSrc, onClose }) => {
  // Блокируем скролл страницы при открытии лайтбокса
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      role="dialog"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      onKeyPress={(e) => {
        if (e.key === 'Enter') onClose();
      }}
    >
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>
      <img
        src={imageSrc}
        alt="Полноразмерное фото"
        className="lightbox-image"
      />
    </div>
  );
};

export default Lightbox;
