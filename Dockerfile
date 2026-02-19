FROM node:20-alpine

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install -g @quasar/cli
RUN npm install

# Копирование исходного кода
COPY . .

# Аргумент для API URL (можно переопределить в docker-compose)
ARG API_URL=http://localhost:8000
ENV VITE_API_URL=$API_URL

EXPOSE 9000

# Для разработки
# CMD ["quasar", "dev"]

# Для продакшена раскомментировать:
RUN quasar build
CMD ["quasar", "serve", "./dist/spa", "--port", "9000"]