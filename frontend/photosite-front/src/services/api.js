import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL;
// const BASE_FULLSIZE_PICTURES_URL = import.meta.env.VITE_BASE_FULLSIZE_PICTURES_URL;

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

// Установка/удаление токена
export const setAuthToken = (token) => {
  if (token) {
    apiAuthClient.defaults.headers['Authorization'] = `Bearer ${token}`;
    apiFormFileClient.defaults.headers['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('access_token', token);
  } else {
    delete apiAuthClient.defaults.headers['Authorization'];
    delete apiFormFileClient.defaults.headers['Authorization'];
    localStorage.removeItem('access_token');
  }
};

// Обновление токена через refresh_token
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Refresh token not found');

  try {
    const response = await apiClient.post('/token/refresh', {
      refresh_token: refreshToken,
    });

    const newAccessToken = response.data.access_token;
    localStorage.setItem('access_token', newAccessToken);
    setAuthToken(newAccessToken);

    return newAccessToken;
  } catch (error) {
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


// Функция для создания новой
export const createShoot = async (formData) => {
  try {
    // 1. Получаем токен из localStorage
    const token = getAccessToken();
    
    if (!token) {
      throw new Error('Нет токена авторизации');
    }

    // 2. Явно обновляем заголовки клиента (на случай, если токен изменился)
    apiFormFileClient.defaults.headers['Authorization'] = `Bearer ${token}`;

    // 3. Отправляем запрос
    const response = await apiFormFileClient.post('/pictures/', formData);
    
    return response.data;

  } catch (error) {
    // 4. Если ошибка 401 — токен устарел, пробуем обновить
    if (error.response?.status === 401) {
      try {
        console.log('Токен устарел, пытаемся обновить...');
        const newToken = await refreshToken(); // Обновляем токен
        
        // 5. Повторяем запрос с новым токеном
        apiFormFileClient.defaults.headers['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await apiFormFileClient.post('/pictures/', formData);
        return retryResponse.data;
      } catch (refreshError) {
        console.error('Не удалось обновить токен:', refreshError);
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      }
    }

    // 6. Другие ошибки
    throw error.response?.data || error.message;
  }
};

// Функция для добавления фотографий к существующей съемке
export const addPicturesToExistingEvent = async (category, date, files) => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Нет токена авторизации');
    }

    // Обновляем заголовок с актуальным токеном
    apiFormFileClient.defaults.headers['Authorization'] = `Bearer ${token}`;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiFormFileClient.patch(`/events/${category}/${date}/pictures`, formData);
    return response.data;

  } catch (error) {
    if (error.response?.status === 401) {
      try {
        console.log('Токен устарел, пытаемся обновить...');
        const newToken = await refreshToken();
        apiFormFileClient.defaults.headers['Authorization'] = `Bearer ${newToken}`;

        const retryResponse = await apiFormFileClient.patch(`/events/${category}/${date}/pictures`, formData);
        return retryResponse.data;
      } catch (refreshError) {
        console.error('Не удалось обновить токен:', refreshError);
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      }
    }
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
