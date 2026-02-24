// Components/Admin/Forms/UpdateCoverForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FileInput from '../UI/FileInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { editEventCover } from '../../../services/api';

const UpdateCoverForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [newCover, setNewCover] = useState(null);

  const { loading, error, success, handleSubmit } = useFormHandler(async () => {
    if (!newCover) {
      throw new Error('Пожалуйста, выберите файл обложки');
    }
    await editEventCover(category, date, newCover);
  });

  const onSubmit = (e) => handleSubmit(e, { category, date, newCover });

  return (
    <BaseForm
      title="Обновить обложку съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText={loading ? 'Обновление...' : 'Обновить обложку'}
      submitDisabled={loading}
    >
      <FormMessageBlock error={error} success={success} />

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

        <FileInput
          label="Новая обложка съёмки"
          accept="image/*"
          onChange={(e) => setNewCover(e.target.files[0])}
          required
        />
      </div>

      {loading && <Loader />}
    </BaseForm>
  );
};

export default UpdateCoverForm;
