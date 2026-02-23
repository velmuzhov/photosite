import React from 'react';
import { Link } from 'react-router-dom';

const BaseForm = ({ title, children, onSubmit, cancelPath }) => {
  return (
    <div className="app-container p-4">
      <h2>{title}</h2>
      
      <form onSubmit={onSubmit} className="mt-4">
        {children}
        
        <div className="flex-container mt-4 gap-3">
          <button
            type="submit"
            className="btn bg-success text-light rounded"
          >
            Выполнить
          </button>
          
          <Link
            to={cancelPath}
            className="btn bg-secondary text-light rounded"
          >
            Вернуться в админку
          </Link>
        </div>
      </form>
    </div>
  );
};

export default BaseForm;
