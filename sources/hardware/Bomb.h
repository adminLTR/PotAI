class Bomb
{
private:
    int pin;
public:
    Bomb(int pin) {
        this->pin = pin;
    }
    ~Bomb() {}
    void water(int time) {
        digitalWrite(this->pin, HIGH);
        delay(time);
        digitalWrite(this->pin, LOW);
    }
};