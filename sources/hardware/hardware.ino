#include <WiFi.h>
#include <HTTPClient.h>
#include "Dht11.h"
#include "MoistureSoil.h"
#include "Bomb.h"
#include <ArduinoJson.h>

// 18.473ml/s

#define DHTPIN 4 
#define MOISTUREPIN 34
#define BOMBPIN 2

const char* ssid = "LTR";
const char* password = "2J8LQV5L";

String codESP32 = "ESP32LT";  // <- Valor del campo `placa`
String serverUrl = "http://192.168.1.113:8000/plantas/actualizar/" + codESP32 + "/";

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
  Serial.print("Conectando a WiFi...");
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
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["temperatura"] = temperatura;
  doc["humedad"] = humedad;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.PUT(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Respuesta del servidor:");
    Serial.println(response);

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
  }

  http.end();
}


    lastRequestTime = currentTime;
  }

  delay(10000);  // Espera 10 segundos antes de volver a verificar
}
