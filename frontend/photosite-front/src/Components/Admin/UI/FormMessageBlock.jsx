import React from 'react';

const FormMessageBlock = ({ error, success }) => (
  <>
    {error && <div className="error-message">{error}</div>}
    {success && <div className="success-message">{success}</div>}
  </>
);

export default FormMessageBlock;
