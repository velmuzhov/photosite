// Components/Admin/Forms/UpdateDescriptionForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { getEventDetailAdmin } from '../../../services/api';

const UpdateDescriptionForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const { loading, error, handleSubmit } = useFormHandler(async () => {
    await getEventDetailAdmin(category, date);
    window.location.href = `/admin/update-description/${category}/${date}`;
  });

  const onSubmit = (e) => handleSubmit(e, { category, date });

  return (
    <BaseForm
      title="Обновить описание съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText="Перейти к обновлению описания"
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

export default UpdateDescriptionForm;
