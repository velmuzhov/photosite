import React from 'react';
import './PaginationButton.css';

const PaginationButton = ({ children, onClick, variant = 'default', disabled = false, className = '' }) => {
  return (
    <button
      className={`pagination-btn pagination-btn-${variant} ${disabled ? 'pagination-btn-disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

export default PaginationButton;
