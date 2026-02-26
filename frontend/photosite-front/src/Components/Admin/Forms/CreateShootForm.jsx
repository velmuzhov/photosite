// Components/Admin/Forms/CreateShootForm.jsx
import React, { useState } from 'react';
import BaseForm from './BaseForm';
import CategorySelector from '../UI/CategorySelector';
import DateInput from '../UI/DateInput';
import FileInput from '../UI/FileInput';
import FormMessageBlock from '../UI/FormMessageBlock';
import Loader from '../UI/Loader';
import { useFormHandler } from '../../../Hooks/useFormHandler';
import { createShoot } from '../../../services/api';

const CreateShootForm = () => {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [coverFile, setCoverFile] = useState(null);

  const { loading, error, success, handleSubmit } = useFormHandler(async () => {
    const data = new FormData();
    data.append('category', category);
    data.append('date', date);
    if (eventDescription) {
      data.append('event_description', eventDescription);
    }
    data.append('event_cover', coverFile);
    files.forEach((file) => data.append('files', file));
    await createShoot(data);
  });

  const onSubmit = (e) =>
    handleSubmit(e, { category, date, eventDescription, files, coverFile });

  return (
    <BaseForm
      title="Создать съёмку"
      onSubmit={onSubmit}
      cancelPath="/admin"
      submitText="Создать съёмку"
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

        <div>
          <label className="fw-bold">Описание</label>
          <textarea
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={3}
            className="w-100"
          />
        </div>

        <FileInput className='improved-file-display'
          label="Обложка съёмки"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files[0])}
          required
        />

        <FileInput className='improved-file-display'
          label="Фотографии съёмки"
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

export default CreateShootForm;
