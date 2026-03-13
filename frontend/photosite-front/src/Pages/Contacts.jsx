import React from 'react';
import './Contacts.css';

const Contacts = () => {
  return (
    <div className="contacts-page">
      <section className="contacts-section">
        <h1>Контакты</h1>
        <p>Свяжитесь со мной удобным способом:</p>

        <div className="contacts-list">
          {/* Телефон */}
          <a
            href="tel:+79056696161"
            className="contact-item"
          >
            <img
              src="/phone-c.svg"
              alt="Телефон"
              className="contact-icon"
            />
            <span className="contact-text">+7-905-669-63-61</span>
          </a>

          {/* ВКонтакте */}
          <a
            href="https://vk.com/velmuzhov"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item"
          >
            <img
              src="/vk-c.svg"
              alt="ВКонтакте"
              className="contact-icon"
            />
            <span className="contact-text">velmuzhov</span>
          </a>

          {/* Телеграм */}
          <a
            href="https://t.me/velmuzhov"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-item"
          >
            <img
              src="/telegram-c.svg"
              alt="Телеграм"
              className="contact-icon"
            />
            <span className="contact-text">velmuzhov</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Contacts;
