import { useState } from 'react';

export const useFormHandler = (submitFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e, formData) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await submitFunction(formData);
      setSuccess('Операция успешно выполнена!');
    } catch (err) {
      setError(err.message || 'Произошла ошибка при выполнении операции');
    }
    setLoading(false);
  };

  return { loading, error, success, handleSubmit };
};
