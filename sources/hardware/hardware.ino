#include "Dht11.h"
#include "MoistureSoil.h"

#define DHTPIN 4 
#define MOISTUREPIN 34

Dht11 dht(DHTPIN);
MoistureSoil ms_sensor(MOISTUREPIN);
String codESP32 = "ESP32LT"

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  dht.read();

  Serial.print("Humedad: ");
  Serial.print(ms_sensor.getHumidity());
  Serial.print(" %\t");
  Serial.print("Temperatura: ");
  Serial.print(dht.getTemperature());
  Serial.println(" °C");

  delay(2000); // Espera 2 segundos entre lecturas
}
