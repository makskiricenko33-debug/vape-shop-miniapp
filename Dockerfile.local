Используем official Python runtime как базовый образ
FROM python:3.11-slim

Устанавливаем рабочую директорию
WORKDIR /app

Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y
gcc
postgresql-client
&& rm -rf /var/lib/apt/lists/*

Копируем requirements.txt и устанавливаем Python зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

Копируем весь код приложения
COPY . .

Expose порт
EXPOSE 8000

Создаём директории для логов
RUN mkdir -p logs

Запускаем приложение
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]