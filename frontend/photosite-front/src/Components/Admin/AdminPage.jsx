import React from 'react';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  return (
    <div className="app-container p-4">
      <h1>Админка</h1>
      
      <div className="flex-container mt-4">
        <Link 
          to="/admin/create-shoot"
          className="btn bg-primary text-light rounded"
        >
          Создать съёмку
        </Link>
      </div>
    </div>
  );
};

export default AdminPage;
