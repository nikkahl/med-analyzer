// index.js

const express = require('express');

// Створюємо екземпляр застосунку
const app = express();

// Визначаємо порт. Беремо його зі змінних середовища або використовуємо 3000 за замовчуванням
const PORT = process.env.PORT || 3000;

// Створюємо простий маршрут для головної сторінки
app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

// Запускаємо сервер
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});