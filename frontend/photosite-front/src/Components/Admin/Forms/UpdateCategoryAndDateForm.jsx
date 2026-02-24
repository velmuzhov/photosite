// Components/Admin/Forms/UpdateCategoryAndDateForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { editEventBaseData } from '../../../services/api';

const UpdateCategoryAndDateForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDate, setNewDate] = useState('');

  const { loading, error, success, handleSubmit } = useFormHandler(async () => {
    await editEventBaseData(category, date, newCategory, newDate);
  });

  const onSubmit = (e) =>
    handleSubmit(e, { category, date, newCategory, newDate });

  return (
    <BaseForm
      title="Обновить категорию и дату съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText={loading ? 'Обновление...' : 'Обновить категорию и дату'}
      submitDisabled={loading}
    >
      <FormMessageBlock error={error} success={success} />

      <div className="grid-container gap-3 mt-3">
        <CategorySelector
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          label="Текущая категория"
          required
        />

        <DateInput
          value={date}
          onChange={(e) => setDate(e.target.value)}
          label="Текущая дата съёмки (ГГГГ-ММ-ДД)"
          required
        />

        <CategorySelector
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          label="Новая категория"
        />

        <DateInput
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          label="Новая дата съёмки (ГГГГ-ММ-ДД)"
        />
      </div>

      {loading && <Loader />}
    </BaseForm>
  );
};

export default UpdateCategoryAndDateForm;
