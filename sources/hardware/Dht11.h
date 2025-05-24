#include <DHT.h>

#define DHTTYPE DHT11    // Modelo de sensor

class Dht11
{
private:
    float temperature;
    float humidity;
    DHT*dht;
public:
    Dht11(int pin) {
        dht = new DHT(pin, DHTTYPE);
    }

    void begin() {
      this->dht->begin();
    }

    void read() {
        this->humidity = dht->readHumidity();
        this->temperature = dht->readTemperature();
    }
    float getTemperature() {
      return this->temperature;
    }
    float getHumidity() {
      return this->humidity;
    }
    ~Dht11() {}
};