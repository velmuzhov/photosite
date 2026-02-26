import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Получаем токен из localStorage
const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

// Клиент для НЕАВТОРИЗОВАННЫХ запросов
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Клиент для АВТОРИЗОВАННЫХ JSON-запросов
const apiAuthClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Клиент для x-www-form-urlencoded (для логина)
const apiFormClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Клиент для multipart/form-data (загрузка файлов)
const apiFormFileClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Флаг для предотвращения параллельных обновлений токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};


// Интерцепторы для клиентов, связанных с запросами, требующими авторизации
[
  apiAuthClient,
  apiFormClient,
  apiFormFileClient
].map((client) => {
  // Интерцептор запросов — добавляем токен перед каждым запросом
client.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор ответов — централизованная обработка 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Если обновление уже идёт, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiAuthClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiAuthClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        setAuthToken(null);
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
})


// Установка/удаление токена
export const setAuthToken = (token) => {
  if (token) {
    apiAuthClient.defaults.headers['Authorization'] = `Bearer ${token}`;
    apiFormFileClient.defaults.headers['Authorization'] = `Bearer ${token}`;
    apiFormClient.defaults.headers['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('access_token', token);
  } else {
    delete apiAuthClient.defaults.headers['Authorization'];
    delete apiFormFileClient.defaults.headers['Authorization'];
    delete apiFormClient.defaults.headers['Authorization'];
    localStorage.removeItem('access_token');
  }
};

// Обновление токена через refresh_token
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Refresh token not found');

  try {
    // Отправляем refresh‑токен в заголовке Authorization
    const response = await apiClient.post('/users/token/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
    });

    const { access_token, refresh_token } = response.data;

    if (!access_token || !refresh_token) {
      throw new Error('Server did not return tokens');
    }

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setAuthToken(access_token);

    return access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthToken(null);
    throw error;
  }
};


// === API-МЕТОДЫ ===

// НЕАВТОРИЗОВАННЫЕ запросы
export const getEventsByCategory = async (category, page = 1, limit = 24) => {
  try {
    const response = await apiClient.get(`/events/${category}`, {
      params: { page, limit },
    });
    return response;
  } catch (error) {
    console.error('Ошибка загрузки съёмок:', error);
    throw error;
  }
};

export const getEventDetail = async (category, date) => {
  try {
    const response = await apiClient.get(`/events/${category}/${date}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка загрузки детали съёмки:', error);
    throw error;
  }
};

// АВТОРИЗОВАННЫЕ запросы

export const login = async (username, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    // Явно убираем Authorization для логина
    const config = {
      headers: {
        'Authorization': undefined,
      },
    };

    const response = await apiFormClient.post('/users/token', formData, config);

    if (response.status !== 200) {
      throw new Error(`Ошибка авторизации: ${response.status}`);
    }

    const { access_token, refresh_token } = response.data;

    console.log(response.data);

    if (!access_token || !refresh_token) {
      throw new Error('Сервер не вернул токены');
    }

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    setAuthToken(access_token);

    return response.data;
  } catch (error) {
    console.error('Ошибка авторизации:', error.response?.data || error.message);
    throw error;
  }
};

// Функция для создания новой съёмки
export const createShoot = async (formData) => {
  try {
    const response = await apiFormFileClient.post('/pictures/', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Функция для добавления фотографий к существующей съёмке
export const addPicturesToExistingEvent = async (category, date, files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiFormFileClient.patch(`/events/${category}/${date}/pictures`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const checkAuth = async () => {
  try {
    // Проверяем токен перед запросом
    const token = getAccessToken();
    if (!token) return false;

    await apiAuthClient.get('/users/me');
    return true;
  } catch (error) {
    return false;
  }
};

// Получаем фотографии съёмки для админки (с админскими данными)
export const getEventPicturesForAdmin = async (category, date) => {
  try {
    const response = await apiAuthClient.get(`/events/${category}/${date}/admin`);
    return response.data;
  } catch (error) {
    console.error('Ошибка загрузки фотографий для админки:', error);
    throw error.response?.data || error.message;
  }
};

// Удаляем выбранные фотографии
export const deletePictures = async (picturePaths) => {
  try {
    const response = await apiAuthClient.delete('/pictures', {
      data: picturePaths,
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка удаления фотографий:', error);
    throw error.response?.data || error.message;
  }
};

// Получение данных съемки в админке без фотографий
export const getEventDetailAdmin = async (category, date) => {
  try {
    const response = await apiAuthClient.get(`/events/${category}/${date}/admin_no_pictures`);
    return response.data;
  } catch (error) {
    console.error('Ошибка загрузки информации о съёмки:', error);
    throw error;
  }
};

// Обновление описания съёмки
export const updateEventDescription = async (category, date, description) => {
  try {
    const formData = new FormData();
    formData.append('description', description);

    const response = await apiFormClient.patch(`/events/${category}/${date}/description`, formData);
    return response.data;
  } catch (error) {
    console.error('Ошибка обновления описания съёмки:', error);
    throw error.response?.data || error.message;
  }
};

// Удаление описания съёмки
export const deleteEventDescription = async (category, date) => {
  try {
    const response = await apiAuthClient.delete(`/events/${category}/${date}/description`);
    return response.data;
  } catch (error) {
    console.error('Ошибка удаления описания съёмки:', error);
    throw error.response?.data || error.message;
  }
};

// Удаление съёмки
export const deleteEvent = async (category, date) => {
  try {
    const response = await apiAuthClient.delete(`/events/${category}/${date}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка удаления съёмки:', error);
    throw error.response?.data || error.message;
  }
};

// Изменение статуса активности съёмки
export const toggleEventActivity = async (category, date) => {
  try {
    const response = await apiAuthClient.patch(`/events/${category}/${date}/active`);
    return response.data;
  } catch (error) {
    console.error('Ошибка изменения статуса активности съёмки:', error);
    throw error.response?.data || error.message;
  }
};

// Получение списка неактивных съёмок
export const getInactiveEvents = async () => {
  try {
    const response = await apiAuthClient.get('/events/inactive');
    return response.data;
  } catch (error) {
    console.error('Ошибка загрузки неактивных съёмок:', error);
    throw error.response?.data || error.message;
  }
};

// Обновление категории и даты съёмки
export const editEventBaseData = async (category, date, newCategory, newDate) => {
  try {
    const formData = new FormData();
    if (newCategory) formData.append('new_category', newCategory);
    if (newDate) formData.append('new_date', newDate);

    const response = await apiFormClient.patch(`/events/${category}/${date}`, formData);
    return response.data;
  } catch (error) {
    console.error('Ошибка обновления категории и даты съёмки:', error);
    throw error.response?.data || error.message;
  }
};

// Обновление обложки съёмки
export const editEventCover = async (category, date, newCover) => {
  try {
    const formData = new FormData();
    formData.append('new_cover', newCover);

    const response = await apiFormFileClient.patch(`/events/${category}/${date}/cover`, formData);
    return response.data;
  } catch (error) {
    console.error('Ошибка обновления обложки съёмки:', error);
    throw error.response?.data || error.message;
  }
};

// Очистка кеша на бэкенде
export const clearCache = async () => {
  try {
    const response = await apiAuthClient.get('/events/cache_reset');
    return response.data;
  } catch (error) {
    console.error('Ошибка очистки кеша:', error);
    throw error.response?.data || error.message;
  }
};
