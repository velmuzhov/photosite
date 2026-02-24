import React from 'react';

const FileInput = ({
  label,
  accept = 'image/*',
  multiple = false,
  onChange,
  required = false,
  className = 'w-100'
}) => (
  <div>
    <label className="fw-bold">{label}</label>
    <input
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={onChange}
      required={required}
      className={className}
    />
  </div>
);

export default FileInput;
