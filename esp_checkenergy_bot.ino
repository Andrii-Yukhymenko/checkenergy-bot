#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "Xiaomi_20DA";
const char* password = "12187539";
const char* serverUrl = "http://your_ip:your_port/checkenergy"; // Введите ip и порт своего сервера
const unsigned long interval = 3000; // Интервал отправки запросов в миллисекундах

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
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(wifiClient, serverUrl); // Используем WiFiClient

      int httpResponseCode = http.POST("");

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

