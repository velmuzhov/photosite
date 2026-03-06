# Этап сборки фронтенда
FROM node:20-bullseye-slim AS builder

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

# Создаём группу и пользователя с теми же ID, что в контейнере api (UID=1000, GID=1000)
RUN groupadd -g 1000 worker && \
    useradd -u 1000 -g worker -d /var/www -s /bin/sh worker

# Удаляем стандартную конфигурацию nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранные файлы фронтенда в директорию nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx (из корня проекта)
COPY /nginx.conf /etc/nginx/nginx.conf


# Меняем владельца статических файлов на worker:worker
RUN chown -R worker:worker /usr/share/nginx/html


# Настраиваем nginx на работу от имени worker
USER worker

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
