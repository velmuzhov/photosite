import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL;

// Клиент Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiFormClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Установка токена авторизации
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers['Authorization'];
  }
};

// Получение съёмок по категории
export const getEventsByCategory = async (category, page = 1, limit = 24) => {
  try {
    const response = await apiClient.get(`/events/${category}`, {
      params: {
        page,
        limit,
      }
    });
    return response;
  } catch (error) {
    console.error('Ошибка загрузки съёмок:', error);
    throw error;
  }
};

// Получение детали съёмки (с фото)
export const getEventDetail = async (category, date) => {
  try {
    const response = await apiClient.get(`/events/${category}/${date}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка загрузки детали съёмки:', error);
    throw error;
  }
};

// Авторизация
export const login = async (username, password) => {
  try {
    const response = await apiFormClient.post('/users/token', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    throw error;
  }
};
