import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Сохраняем позицию прокрутки для текущего маршрута
    const key = `scroll-${pathname}`;
    const savedPosition = sessionStorage.getItem(key);

    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem(key); // Очищаем после восстановления
    } else {
      window.scrollTo(0, 0); // Новая страница — скролл наверх
    }

    // При уходе с страницы сохраняем позицию
    const handleScroll = () => {
      sessionStorage.setItem(key, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
