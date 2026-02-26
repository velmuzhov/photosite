import React from 'react';
import './PaginationButton.css';

const PaginationButton = ({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  isActive = false, // Новое проп для активной страницы
  className = ''
}) => {
  const buttonClasses = [
    'pagination-btn',
    `pagination-btn-${variant}`,
    disabled ? 'pagination-btn-disabled' : '',
    isActive ? 'active' : '', // Добавляем класс active при необходимости
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      type="button"
      aria-current={isActive ? 'page' : undefined} // Для доступности
    >
      {children}
    </button>
  );
};

export default PaginationButton;
