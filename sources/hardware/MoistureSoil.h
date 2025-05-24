
class MoistureSoil
{
private:
    double humidity;
    int pin;
    int dry = 2200;
    int wet = 0;
public:
    MoistureSoil(int pin) {
        this->pin = pin;
    }
    
    int getHumidity() {
        int x = analogRead(this->pin);
        return map(x, wet, dry, 0, 100);
        // return x;
    }

    ~MoistureSoil() {}
};