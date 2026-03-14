import React from 'react';
import './Home.css';

const Home = () => {
  const handleImageContextMenu = (event) => {
    event.preventDefault(); // Запрещаем контекстное меню
  };

  return (
    <div className="home-page">
      <h1>Владимир Вельмужов | фотограф в Арзамасе</h1>
      <p>Фотографирую людей с 2006 года. Огромный опыт, предсказуемый результат и адекватные сроки.</p>

      {/* Блок с изображениями */}
      <div className="images-grid">
        <div className="image-container">
          <img
            src="/mainpage1.jpg"
            alt="Фотография с фотосессии"
            onContextMenu={handleImageContextMenu}
            loading="lazy"
            className="responsive-image"
          />
        </div>
        <div className="image-container hide-on-vertical">
          <img
            src="/mainpage2.jpg"
            alt="Ещё одна фотография"
            onContextMenu={handleImageContextMenu}
            loading="lazy"
            className="responsive-image"
          />
        </div>
      </div>

      {/* Ссылка на VK */}
      <a
        href="https://vk.com/velmuzhov"
        target="_blank"
        rel="noopener noreferrer"
        className="vk-link"
      >
        <img src="/vk-m.svg" alt="ВКонтакте" className="vk-icon" />
      </a>
    </div>
  );
};

export default Home;
