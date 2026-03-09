import React, { useEffect, useRef, useState } from 'react';

const Lightbox = ({ imageSrc, onClose }) => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Состояние масштабирования и позиционирования
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startDistance, setStartDistance] = useState(0);
  const [lastScale, setLastScale] = useState(1);
  const [pinchCenter, setPinchCenter] = useState({ x: 0, y: 0 });
  const [isResetting, setIsResetting] = useState(false);

  // Обработчик нажатия Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Вычисление расстояния между точками касания
  const getDistance = (touch1, touch2) => {
    const xDiff = touch2.clientX - touch1.clientX;
    const yDiff = touch2.clientY - touch1.clientY;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  };

  // Расчёт центра между двумя точками касания
  const getCenter = (touch1, touch2) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setStartDistance(getDistance(e.touches[0], e.touches[1]));
      setLastScale(scale);
      setPinchCenter(getCenter(e.touches[0], e.touches[1]));
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();

      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const pinchScale = currentDistance / startDistance;
      let newScale = Math.max(1, Math.min(3, lastScale * pinchScale));

      // Новый центр касания
      const newCenter = getCenter(e.touches[0], e.touches[1]);

      if (imageRef.current && containerRef.current) {
        const img = imageRef.current;
        const container = containerRef.current;

        // Размеры контейнера и изображения
        const containerRect = container.getBoundingClientRect();
        const imageRect = img.getBoundingClientRect();

        // Центрирование изображения изначально
        const centerOffsetX = (containerRect.width - imageRect.width) / 2;
        const centerOffsetY = (containerRect.height - imageRect.height) / 2;

        // Позиция центра касания относительно изображения
        const centerRelativeToImage = {
          x: newCenter.x - containerRect.left - imageRect.width / 2 - centerOffsetX,
          y: newCenter.y - containerRect.top - imageRect.height / 2 - centerOffsetY
        };

        // Смещение точки масштабирования
        const scaleDiff = newScale / scale;

        let deltaX = (newCenter.x - pinchCenter.x) -
             centerRelativeToImage.x * (scaleDiff - 1);
        let deltaY = (newCenter.y - pinchCenter.y) -
             centerRelativeToImage.y * (scaleDiff - 1);

        let newX = position.x * scaleDiff + deltaX;
        let newY = position.y * scaleDiff + deltaY;

        // АВТОМАТИЧЕСКИЙ ВОЗВРАТ ПРИ УМЕНЬШЕНИИ ДО 1×
        if (newScale <= 1.1) {
          newScale = 1;
          newX = 0;
          newY = 0;
          setIsResetting(true);
        } else {
          setIsResetting(false);
        }

        setPosition({ x: newX, y: newY });
        setScale(newScale);
        setPinchCenter(newCenter);
      }
    }
  };

  const handleTouchEnd = () => {
    setStartDistance(0);
    setLastScale(scale);

    // Если после отпускания пальцев масштаб близок к 1, сбрасываем позицию
    if (scale <= 1.1) {
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
  };

  // Сброс масштабирования при закрытии
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setPinchCenter({ x: 0, y: 0 });
    setIsResetting(false);
  };

  const handleOverlayClick = (e) => {
    if (
      e.target === e.currentTarget ||
      e.target.classList.contains('lightbox-image')
    ) {
      onClose();
      resetZoom();
    }
  };

  return (
    <div
      className="lightbox-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      ref={containerRef}
    >
      <button
        className="lightbox-close"
        onClick={() => {
          onClose();
          resetZoom();
        }}
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
        ref={imageRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isResetting ? 'transform 0.3s ease-out' : 'transform 0.1s ease'
        }}
      />
    </div>
  );
};

export default Lightbox;
