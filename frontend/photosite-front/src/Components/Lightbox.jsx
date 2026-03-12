import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import { Zoom } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/zoom.css';

const LightboxComponent = ({ images, currentIndex, isOpen, onClose }) => {
  const slides = images.map(img => ({
    src: `${import.meta.env.VITE_BASE_FULLSIZE_PICTURES_URL}/${img.path}`,
    caption: img.caption || ''
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex}
      controller={{ closeOnBackdropClick: true, swipeToClose: true }}
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 3, // макс. увеличение: в 3 раза
        zoomInIcon: '➕', // иконка увеличения
        zoomOutIcon: '➖', // иконка уменьшения
        zoomOutLabel: 'Уменьшить',
        zoomInLabel: 'Увеличить'
        
      }}
    />
  );
};

export default LightboxComponent;
