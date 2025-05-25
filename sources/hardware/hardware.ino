#include "Dht11.h"
#include "MoistureSoil.h"
#include "Bomb.h"

#define DHTPIN 4 
#define MOISTUREPIN 34
#define BOMBPIN 2

unsigned long pressStart = 0;
unsigned long pressDuration = 0;
bool wasPressed = false;

Dht11 dht(DHTPIN);
MoistureSoil ms_sensor(MOISTUREPIN);
Bomb bomb(BOMBPIN);
String codESP32 = "ESP32LT";

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(BOMBPIN, OUTPUT);         // ← CONTROL DE LA BOMBA
}

void loop() {

  // Aquí puedes seguir usando los sensores si deseas
  dht.read();
  Serial.print("Humedad: ");
  Serial.print(ms_sensor.getHumidity());
  Serial.print(" %\t");
  Serial.print("Temperatura: ");
  Serial.print(dht.getTemperature());
  Serial.println(" °C");
  bomb.water(5000);
  delay(10000);
}
