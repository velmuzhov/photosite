import React from 'react';

const CategorySelector = ({
  value,
  onChange,
  label = 'Категория',
  required = false,
  className = 'w-100'
}) => (
  <div>
    <label className="fw-bold">{label}</label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={className}
    >
      <option value="">Выберите категорию</option>
      <option value="wedding">Свадьба</option>
      <option value="portrait">Портрет</option>
      <option value="family">Семья</option>
      <option value="blog">Блог</option>
    </select>
  </div>
);

export default CategorySelector;
