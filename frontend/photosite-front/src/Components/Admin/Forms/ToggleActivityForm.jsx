// Components/Admin/Forms/ToggleActivityForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { toggleEventActivity } from '../../../services/api';

const ToggleActivityForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const { loading, error, success, handleSubmit } = useFormHandler(
    async () => await toggleEventActivity(category, date),
  );

  const onSubmit = (e) => handleSubmit(e, { category, date });

  return (
    <BaseForm
      title="Изменение активности съёмки"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText={loading ? 'Изменение...' : 'Изменить активность съёмки'}
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

export default ToggleActivityForm;
