#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const int buttonPin = 0; // GPIO0
const int ledPin = 2;    // GPIO2 для встроенного светодиода
const char* ssid = "wifi_name";
const char* password = "wifi_password";
const char* serverUrl = "http://your_ip:your_port/checkenergy"; // Введите ip и порт своего сервера
const unsigned long interval = 3000;  // Интервал отправки запросов в миллисекундах
bool serviceMode = false;

unsigned long previousMillis = 0;
WiFiClient wifiClient;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");

  pinMode(buttonPin, INPUT);   // Установка GPIO0 как входа
  pinMode(ledPin, OUTPUT);  // Настраиваем GPIO2 как выход для встроенного светодиода
}

void loop() {
  // Проверяем, нажата ли кнопка FLASH
  if (digitalRead(buttonPin) == LOW) {
    // Если кнопка нажата (состояние LOW), выводим сообщение
    serviceMode = !serviceMode;
    Serial.println("Кнопка FLASH нажата!");
    // Ждем пока кнопка будет отпущена, чтобы избежать повторного срабатывания
    while (digitalRead(buttonPin) == LOW) {
      delay(50);
    }
  }

  if (serviceMode == true) {
    digitalWrite(ledPin, LOW);  // На NodeMCU встроенный светодиод включается при LOW
  } else {
    digitalWrite(ledPin, HIGH); // На NodeMCU встроенный светодиод выключается при HIGH
  }

  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(wifiClient, serverUrl);

      int httpResponseCode;

      if (serviceMode) {
        Serial.println("service mode");
        http.addHeader("Content-Type", "text/plain");
        httpResponseCode = http.POST("Service mode");
        //serviceMode = false;
      } else {
        http.addHeader("Content-Type", "text/plain");
        httpResponseCode = http.POST("OK");
      }

      if (httpResponseCode > 0) {
        Serial.println("Data sent successfully");
      } else {
        Serial.printf("Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
      }

      http.end();
    } else {
      Serial.println("WiFi not connected");
    }
  }
}
