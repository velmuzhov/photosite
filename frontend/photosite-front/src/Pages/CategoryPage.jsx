import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventCard from '../Components/EventCard';
import PaginationButton from '../Components/PaginationButton';
import { getEventsByCategory } from '../services/api';
import './CategoryPage.css';

const CategoryPage = ({ category, title }) => {
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const LIMIT = 24;

  // Работа с query‑параметрами URL
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(pageFromUrl);

  // Вычисляем общее число страниц
  const totalPages = Math.ceil(totalCount / LIMIT);

  useEffect(() => {
    const fetchEvents = async (page) => {
      setLoading(true);
      setError(null); // Сбрасываем ошибку при новом запросе

      try {
        const response = await getEventsByCategory(category, page);
        setEvents(response.data.events || []);
        const total = response.data.total_count;
        setTotalCount(Number(total) || 0);
      } catch (err) {
        console.error(`Не удалось загрузить ${title}:`, err);
        setError('Произошла ошибка при загрузке событий. Пожалуйста, попробуйте позже.');
        setEvents([]);
        setTotalCount(0);
      }
      setLoading(false);
    };

    fetchEvents(currentPage);
  }, [category, currentPage]);

  // Синхронизация currentPage с pageFromUrl при изменении URL
  useEffect(() => {
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [pageFromUrl]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSearchParams({ page });
    }
  };

  const renderPagination = () => {
    // ... существующая логика пагинации
  };

  const renderLoader = () => (
    <div className="loader-container">
      <div className="loader" aria-label="Загрузка событий..."></div>
      <p className="loading-state">Загрузка</p>
    </div>
  );

  const renderError = () => (
    <div className="error-message">
      <h3>Ошибка загрузки</h3>
      <p>{error}</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="empty-state">
      <p>В данной категории пока нет съемок.</p>
    </div>
  );

  return (
    <div className="category-page">
      <h1>{title}</h1>

      {error ? (
        renderError()
      ) : loading ? (
        renderLoader()
      ) : events.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="grid-container">
            {events.map((event) => (
              <EventCard
                key={event.id || event.date}
                event={event}
                category={category}
              />
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default CategoryPage;
