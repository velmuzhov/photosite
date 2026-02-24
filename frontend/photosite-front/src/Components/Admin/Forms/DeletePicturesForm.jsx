// Components/Admin/Forms/DeletePicturesForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { getEventPicturesForAdmin } from '../../../services/api';

const DeletePicturesForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const { loading, error, handleSubmit } = useFormHandler(async () => {
    await getEventPicturesForAdmin(category, date);
    window.location.href = `/admin/manage-pictures/${category}/${date}`;
  });

  const onSubmit = (e) => handleSubmit(e, { category, date });

  return (
    <BaseForm
      title="Удалить фотографии из съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText="Перейти к управлению фотографиями"
      submitDisabled={loading}
    >
      <FormMessageBlock error={error} />

      <div className="grid-container gap-3 mt-3">
        <CategorySelector
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <DateInput
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {loading && <Loader />}
    </BaseForm>
  );
};

export default DeletePicturesForm;
