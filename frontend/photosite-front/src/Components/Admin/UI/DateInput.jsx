import React from 'react';

const DateInput = ({
  value,
  onChange,
  label = 'Дата съёмки (ГГГГ-ММ-ДД)',
  required = false,
  className = 'w-100'
}) => (
  <div>
    <label className="fw-bold">{label}</label>
    <input
      type="date"
      value={value}
      onChange={onChange}
      required={required}
      className={className}
    />
  </div>
);

export default DateInput;
