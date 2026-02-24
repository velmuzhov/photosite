// Components/Admin/Forms/DeleteDescriptionForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import {
  getEventDetailAdmin,
  deleteEventDescription,
} from '../../../services/api';

const DeleteDescriptionForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const { loading, error, success, handleSubmit } = useFormHandler(async () => {
    const eventData = await getEventDetailAdmin(category, date);

    if (!eventData.description) {
      throw new Error('У этой съёмки нет описания для удаления');
    }

    const confirmDelete = window.confirm(
      `Вы уверены, что хотите удалить описание съёмки?\n\n` +
        `Категория: ${category}\nДата: ${date}\n\n` +
        `Текущее описание: "${eventData.description.substring(0, 100)}${eventData.description.length > 100 ? '...' : ''}"`,
    );

    if (!confirmDelete) throw new Error('Удаление отменено пользователем');

    await deleteEventDescription(category, date);
  });

  const onSubmit = (e) => handleSubmit(e, { category, date });

  return (
    <BaseForm
      title="Удаление описания съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText="Удалить описание"
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

export default DeleteDescriptionForm;
