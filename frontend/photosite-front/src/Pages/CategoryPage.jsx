import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../Components/EventCard';
import { getEventsByCategory } from '../services/api';
import './CategoryPage.css';

const CategoryPage = ({ category, title }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEventsByCategory(category);
        setEvents(data);
      } catch (error) {
        console.error(`Не удалось загрузить ${title}:`, error);
      }
      setLoading(false);
    };

    fetchEvents();
  }, [category]);

  return (
    <div className="category-page p-3">
      <h1 className="text-center mb-4">{title}</h1>

      {loading ? (
        <div className="d-flex justify-center">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="grid-container">
          {events.map((event) => (
            <EventCard
              key={event.id || event.date}
              event={event}
              category={category}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
