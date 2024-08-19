require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CHECK_INTERVAL = 6000; // Интервал проверки
const TIMEOUT = 15000; // Тайм-аут ожидания запроса

let lastRequestTime = Date.now(); // Время последнего запроса
let alertSent = false; // Флаг уведомления о потере электричества
let restoreAlertSent = true; // Флаг уведомления о восстановлении электричества

app.post('/checkenergy', (req, res) => {
  lastRequestTime = Date.now(); // Обновляем время последнего запроса
  alertSent = false;
  console.log(`Request received at ${new Date().toLocaleString()}`);
  res.sendStatus(200);
});

// Проверка времени последнего запроса
const checkLastRequestTime = () => {
  const currentTime = Date.now();
  console.log(currentTime - lastRequestTime > TIMEOUT);
  if (currentTime - lastRequestTime > TIMEOUT) {
    if (!alertSent) {
      sendTelegramAlert('⚠️ Электричества нет!');
      alertSent = true;
      restoreAlertSent = false;
      console.log("Electricity outage alert sent.");
    }
  } else {
    console.log(alertSent + ' ' + restoreAlertSent);
    if (!restoreAlertSent) {
      sendTelegramAlert('✅ Электричество восстановлено! ESP8266 снова отвечает.');
      restoreAlertSent = true;
      console.log("Electricity restored alert sent.");
    }
  }
};

// Функция отправки уведомления в Telegram
const sendTelegramAlert = (message) => {
  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  })
    .then(response => {
      console.log("Message sent successfully:", response.data);
    })
    .catch(error => {
      console.error('Error sending message to Telegram:', error);
    });
};

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Запускаем периодическую проверку
  setInterval(checkLastRequestTime, CHECK_INTERVAL);
});