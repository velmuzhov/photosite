// Components/Admin/Forms/DeleteEventForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { getEventDetailAdmin, deleteEvent } from '../../../services/api';

const DeleteEventForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const { loading, error, success, handleSubmit } = useFormHandler(async () => {
    const eventData = await getEventDetailAdmin(category, date);

    const confirmDelete = window.confirm(
      `Вы уверены, что хотите удалить съёмку?\n\n` +
        `Категория: ${category}\nДата: ${date}\n\n` +
        `Описание: "${eventData.description?.substring(0, 100) || 'отсутствует'}${eventData.description && eventData.description.length > 100 ? '...' : ''}"`,
    );

    if (!confirmDelete) throw new Error('Удаление отменено пользователем');

    await deleteEvent(category, date);
  });

  const onSubmit = (e) => handleSubmit(e, { category, date });

  return (
    <BaseForm
      title="Удаление съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText="Удалить съёмку"
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
      </div>

      {loading && <Loader />}
    </BaseForm>
  );
};

export default DeleteEventForm;
