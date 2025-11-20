from flask_mysqldb import MySQL

class Plant:
    @staticmethod
    def get_pot_by_label(user_id, label):
        """Busca un pot por label y user_id"""
        cur = MySQL().connection.cursor()
        cur.execute("SELECT id FROM pots WHERE user_id = %s AND label = %s LIMIT 1", (user_id, label))
        row = cur.fetchone()
        cur.close()
        return row[0] if row else None

    @staticmethod
    def create_pot(user_id, label):
        cur = MySQL().connection.cursor()
        cur.execute("INSERT INTO pots (user_id, label) VALUES (%s, %s)", (user_id, label))
        pot_id = cur.lastrowid
        MySQL().connection.commit()
        cur.close()
        return pot_id
    
    @staticmethod
    def get_or_create_pot(user_id, label):
        """Obtiene un pot existente o crea uno nuevo si no existe"""
        pot_id = Plant.get_pot_by_label(user_id, label)
        if pot_id:
            return pot_id, False  # (pot_id, created)
        else:
            pot_id = Plant.create_pot(user_id, label)
            return pot_id, True  # (pot_id, created)

    @staticmethod
    def get_species_id_by_name(species_name):
        """Busca una especie por nombre común o científico (case-insensitive)"""
        cur = MySQL().connection.cursor()
        cur.execute("""
            SELECT id FROM species 
            WHERE LOWER(common_name) = LOWER(%s) 
            OR LOWER(scientific_name) = LOWER(%s) 
            LIMIT 1
        """, (species_name, species_name))
        row = cur.fetchone()
        cur.close()
        return row[0] if row else None

    @staticmethod
    def create_plant(user_id, pot_id, name, image_url, species_id):
        cur = MySQL().connection.cursor()
        cur.execute("INSERT INTO plants (user_id, pot_id, name, image_url, species_id) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, pot_id, name, image_url, species_id))
        plant_id = cur.lastrowid
        MySQL().connection.commit()
        cur.close()
        return plant_id

    @staticmethod
    def get_user_plants_with_conditions(user_id):
        cur = MySQL().connection.cursor()
        cur.execute("SELECT id, name, species_id, pot_id, image_url FROM plants WHERE user_id = %s", (user_id,))
        plants = cur.fetchall()
        result = []
        for plant in plants:
            plant_id = plant[0]
            cur.execute("SELECT temperature_celsius, humidity_percent, moisture_percent, light_lux, recorded_at FROM ambiental_conditions WHERE plant_id = %s ORDER BY recorded_at DESC LIMIT 1", (plant_id,))
            cond = cur.fetchone()
            result.append({
                'id': plant[0],
                'name': plant[1],
                'species_id': plant[2],
                'pot_id': plant[3],
                'image_url': plant[4],
                'last_conditions': {
                    'temperature_celsius': cond[0] if cond else None,
                    'humidity_percent': cond[1] if cond else None,
                    'moisture_percent': cond[2] if cond else None,
                    'light_lux': cond[3] if cond else None,
                    'recorded_at': cond[4].isoformat() if cond else None
                }
            })
        cur.close()
        return result

    @staticmethod
    def get_plant_detail(user_id, plant_id, page=1, per_page=5):
        cur = MySQL().connection.cursor()
        # Verificar que la planta pertenece al usuario
        cur.execute("SELECT id, name, species_id, pot_id, image_url, notes, planted_at FROM plants WHERE id = %s AND user_id = %s", (plant_id, user_id))
        plant = cur.fetchone()
        if not plant:
            cur.close()
            return None
        # Condiciones ambientales actuales
        cur.execute("SELECT temperature_celsius, humidity_percent, moisture_percent, light_lux, recorded_at FROM ambiental_conditions WHERE plant_id = %s ORDER BY recorded_at DESC LIMIT 1", (plant_id,))
        cond = cur.fetchone()
        # Historial de riego paginado
        offset = (page - 1) * per_page
        cur.execute("""
            SELECT wl.id, wl.watered_at, wl.amount_ml, ac.temperature_celsius, ac.humidity_percent, ac.moisture_percent, ac.light_lux, ac.recorded_at
            FROM watering_logs wl
            JOIN ambiental_conditions ac ON wl.ambiental_conditions_id = ac.id
            WHERE ac.plant_id = %s
            ORDER BY wl.watered_at DESC
            LIMIT %s OFFSET %s
        """, (plant_id, per_page, offset))
        watering_history = cur.fetchall()
        # Total de registros para paginación
        cur.execute("""
            SELECT COUNT(*) FROM watering_logs wl
            JOIN ambiental_conditions ac ON wl.ambiental_conditions_id = ac.id
            WHERE ac.plant_id = %s
        """, (plant_id,))
        total = cur.fetchone()[0]
        cur.close()
        return {
            'id': plant[0],
            'name': plant[1],
            'species_id': plant[2],
            'pot_id': plant[3],
            'image_url': plant[4],
            'notes': plant[5],
            'planted_at': plant[6].isoformat() if plant[6] else None,
            'last_conditions': {
                'temperature_celsius': cond[0] if cond else None,
                'humidity_percent': cond[1] if cond else None,
                'moisture_percent': cond[2] if cond else None,
                'light_lux': cond[3] if cond else None,
                'recorded_at': cond[4].isoformat() if cond else None
            },
            'watering_history': [
                {
                    'id': wh[0],
                    'watered_at': wh[1].isoformat() if wh[1] else None,
                    'amount_ml': wh[2],
                    'temperature_celsius': wh[3],
                    'humidity_percent': wh[4],
                    'moisture_percent': wh[5],
                    'light_lux': wh[6],
                    'recorded_at': wh[7].isoformat() if wh[7] else None
                } for wh in watering_history
            ],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }

    @staticmethod
    def get_plant_by_pot_label(pot_label):
        """Obtener planta por el label del macetero (para ESP32)"""
        cur = MySQL().connection.cursor()
        cur.execute("""
            SELECT p.id, p.user_id, p.species_id, s.common_name
            FROM plants p
            JOIN pots pot ON p.pot_id = pot.id
            LEFT JOIN species s ON p.species_id = s.id
            WHERE pot.label = %s
            LIMIT 1
        """, (pot_label,))
        result = cur.fetchone()
        cur.close()
        if result:
            return {
                'plant_id': result[0], 
                'user_id': result[1],
                'species_id': result[2],
                'species_name': result[3]
            }
        return None

    @staticmethod
    def create_ambiental_condition(plant_id, temperature, humidity, moisture, light):
        """Crear registro de condiciones ambientales"""
        cur = MySQL().connection.cursor()
        cur.execute("""
            INSERT INTO ambiental_conditions 
            (plant_id, temperature_celsius, humidity_percent, moisture_percent, light_lux) 
            VALUES (%s, %s, %s, %s, %s)
        """, (plant_id, temperature, humidity, moisture, light))
        condition_id = cur.lastrowid
        MySQL().connection.commit()
        cur.close()
        return condition_id
