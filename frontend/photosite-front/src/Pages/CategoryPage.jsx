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
  const LIMIT = 24;

  // Работа с query-параметрами URL
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(pageFromUrl);

  // Вычисляем общее число страниц
  const totalPages = Math.ceil(totalCount / LIMIT);

  useEffect(() => {
    const fetchEvents = async (page) => {
      setLoading(true);
      try {
        // Запрос на сервер: получаем 24 элемента и заголовок X-Total-Count
        const response = await getEventsByCategory(category, page);

        // Извлекаем данные и общее количество
        setEvents(response.data.events);
        const total = response.data.total_count;
        console.log(response.data.total_count);
        setTotalCount(Number(total) || 0);
      } catch (error) {
        console.error(`Не удалось загрузить ${title}:`, error);
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
      // Обновляем URL
      setSearchParams({ page });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    const { currentPage } = { currentPage };

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationButton
            key={i}
            onClick={() => handlePageChange(i)}
            variant={currentPage === i ? 'default' : 'outline'}
            className={currentPage === i ? 'active' : ''}
          >
            {i}
          </PaginationButton>,
        );
      }
    } else {
      const leftEdge = 2;
      const rightEdge = totalPages - 1;

      pages.push(
        <PaginationButton
          key={1}
          onClick={() => handlePageChange(1)}
          variant={currentPage === 1 ? 'default' : 'outline'}
          className={currentPage === 1 ? 'active' : ''}
        >
          1
        </PaginationButton>,
      );

      if (currentPage > leftEdge + 1) {
        pages.push(
          <span key="ellipsis-left" className="ellipsis">
            ...
          </span>,
        );
        pages.push(
          <PaginationButton
            key={currentPage - 1}
            onClick={() => handlePageChange(currentPage - 1)}
            variant="outline"
          >
            {currentPage - 1}
          </PaginationButton>,
        );
      }

      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(
          <PaginationButton
            key={currentPage}
            onClick={() => handlePageChange(currentPage)}
            variant="default"
            className="active"
          >
            {currentPage}
          </PaginationButton>,
        );
      }

      if (currentPage < rightEdge - 1) {
        pages.push(
          <PaginationButton
            key={currentPage + 1}
            onClick={() => handlePageChange(currentPage + 1)}
            variant="outline"
          >
            {currentPage + 1}
          </PaginationButton>,
        );
        pages.push(
          <span key="ellipsis-right" className="ellipsis">
            ...
          </span>,
        );
      }

      pages.push(
        <PaginationButton
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          variant={currentPage === totalPages ? 'default' : 'outline'}
          className={currentPage === totalPages ? 'active' : ''}
        >
          {totalPages}
        </PaginationButton>,
      );
    }

    return <div className="pagination">{pages}</div>;
  };

  return (
    <div className="category-page p-3">
      <h1 className="text-center mb-4">{title}</h1>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
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
