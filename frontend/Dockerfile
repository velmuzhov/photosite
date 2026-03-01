# Этап сборки фронтенда
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json из папки photosite-front
COPY photosite-front/package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код фронтенда
COPY photosite-front/. .

# Собираем фронтенд
RUN npm run build

# Финальный этап — nginx для раздачи статических файлов
FROM nginx:alpine

# Удаляем стандартную конфигурацию nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранные файлы фронтенда в директорию nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx (из корня проекта)
COPY /nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
