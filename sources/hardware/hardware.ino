#include <WiFi.h>
#include <HTTPClient.h>
#include "Dht11.h"
#include "MoistureSoil.h"
#include "Bomb.h"
#include <ArduinoJson.h>

// 18.473ml/s

#define DHTPIN  27
#define MOISTUREPIN 25
#define BOMBPIN 32

const char* ssid = "VICTORIA 3";
const char* password = "2J8LQV5L";

String codESP32 = "ESP32LT";  // <- Valor del campo `placa`
String serverUrl = "http://10.57.125.193:8000/plantas/actualizar/" + codESP32 + "/";

unsigned long lastRequestTime = 0;
unsigned long interval = 24UL * 60UL * 60UL * 1000UL; // 24 horas en milisegundos

Dht11 dht(DHTPIN);
MoistureSoil ms_sensor(MOISTUREPIN);
Bomb bomb(BOMBPIN);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(BOMBPIN, OUTPUT);

  WiFi.begin(ssid, password);
  delay(2000);
  Serial.print("Conectando a WiFi...");
  delay(2000);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Conectado!");
}

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastRequestTime >= interval || lastRequestTime == 0) {
    dht.read();
    float temperatura = dht.getTemperature();
    float humedad = ms_sensor.getHumidity();

    Serial.print("Temp: ");
    Serial.print(temperatura);
    Serial.print(" | Humedad: ");
    Serial.println(humedad);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.setTimeout(10000); // 10 segundos
      http.addHeader("Content-Type", "application/json");
      Serial.println(serverUrl);

      StaticJsonDocument<200> doc;
      doc["temperatura"] = temperatura;
      doc["humedad"] = humedad;

      String requestBody;
      serializeJson(doc, requestBody);

      int httpResponseCode = http.PUT(requestBody);
      Serial.println(httpResponseCode);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("Respuesta del servidor:");
        Serial.println(response);

        if (httpResponseCode == -1) {
          Serial.print("Error detail: ");
          Serial.println(http.errorToString(httpResponseCode));
        }

        if (httpResponseCode == -1) {
          Serial.print("HTTP Error: ");
          Serial.println(http.errorToString(httpResponseCode));
        }

        // Parsear JSON
        StaticJsonDocument<300> resDoc;
        DeserializationError error = deserializeJson(resDoc, response);

        if (!error) {
          float prediccion = resDoc["prediccion"];  // en mililitros
          Serial.print("Predicción (ml): ");
          Serial.println(prediccion);

          if (prediccion > 0) {
            // Calcular tiempo en milisegundos
            float caudal = 18.473;  // ml/s
            int tiempo_ms = (prediccion / caudal) * 1000;
            Serial.print("Tiempo para regar (ms): ");
            Serial.println(tiempo_ms);
            bomb.water(tiempo_ms);
          } else {
            Serial.println("No se necesita riego.");
          }
        } else {
          Serial.println("Error al parsear la respuesta JSON");
        }
      } else {
        Serial.print("Error HTTP: ");
        Serial.println(httpResponseCode);
        bomb.water(3000);

      }

      http.end();
    }


    lastRequestTime = currentTime;
  }

  delay(10000);  // Espera 10 segundos antes de volver a verificar
}
