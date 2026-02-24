// Components/Admin/Forms/AddPicturesForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FileInput from '../UI/FileInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { addPicturesToExistingEvent } from '../../../services/api';

const AddPicturesForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [files, setFiles] = useState([]);

  const { loading, error, success, handleSubmit } = useFormHandler(
    async () => await addPicturesToExistingEvent(category, date, files),
  );

  const onSubmit = (e) => handleSubmit(e, { category, date, files });

  return (
    <BaseForm
      title="Добавить фотографии к съёмке"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText="Добавить фотографии"
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
          label="Фотографии для загрузки"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files))}
          required
        />
      </div>

      {loading && <Loader />}
    </BaseForm>
  );
};

export default AddPicturesForm;
