# Species Service

Servicio de catálogo de especies de plantas con sus requerimientos de cuidado.

## Puerto
- **3006**
- **Database Port:** 3311

## Base de Datos: potai_species

### Tabla: species
```sql
CREATE TABLE species (
  id INT PRIMARY KEY AUTO_INCREMENT,
  common_name VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(100) NOT NULL,
  water_requirements TEXT,
  light_requirements TEXT,
  humidity_requirements TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_species (common_name, scientific_name),
  INDEX idx_common_name (common_name)
);
```

## Endpoints

### 1. Crear Especie
```http
POST /
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "commonName": "Rosa China",
  "scientificName": "Hibiscus rosa-sinensis",
  "waterRequirements": "Riego moderado, mantener tierra húmeda",
  "lightRequirements": "Sol directo o semi-sombra",
  "humidityRequirements": "Humedad media-alta"
}
```

**Response:**
```json
{
  "id": 6,
  "commonName": "Rosa China",
  "scientificName": "Hibiscus rosa-sinensis",
  "waterRequirements": "Riego moderado, mantener tierra húmeda",
  "lightRequirements": "Sol directo o semi-sombra",
  "humidityRequirements": "Humedad media-alta",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Obtener Todas las Especies
```http
GET /
```

**Response:**
```json
[
  {
    "id": 1,
    "commonName": "Ajo",
    "scientificName": "Allium sativum",
    "waterRequirements": "Riego moderado",
    "lightRequirements": "Sol directo",
    "humidityRequirements": "Baja",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

### 3. Obtener Especie por ID
```http
GET /:id
```

**Response:**
```json
{
  "id": 1,
  "commonName": "Ajo",
  "scientificName": "Allium sativum",
  "waterRequirements": "Riego moderado",
  "lightRequirements": "Sol directo",
  "humidityRequirements": "Baja",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### 4. Buscar Especies
```http
GET /search?q=rosa
```

**Response:**
```json
[
  {
    "id": 6,
    "commonName": "Rosa China",
    "scientificName": "Hibiscus rosa-sinensis",
    "waterRequirements": "Riego moderado, mantener tierra húmeda",
    "lightRequirements": "Sol directo o semi-sombra",
    "humidityRequirements": "Humedad media-alta"
  }
]
```

### 5. Actualizar Especie
```http
PUT /:id
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "waterRequirements": "Riego abundante en verano"
}
```

**Response:**
```json
{
  "id": 6,
  "commonName": "Rosa China",
  "scientificName": "Hibiscus rosa-sinensis",
  "waterRequirements": "Riego abundante en verano",
  "lightRequirements": "Sol directo o semi-sombra",
  "humidityRequirements": "Humedad media-alta",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

## Especies Iniciales (Seed Data)

El servicio incluye 8 especies reconocidas por el modelo ML:

| ID | Nombre Común | Nombre Científico | Agua | Luz | Humedad |
|----|-------------|-------------------|------|-----|---------|
| 1 | Ajo | Allium sativum | Moderado | Sol directo | Baja |
| 2 | Geranio | Pelargonium | Moderado | Sol directo | Media |
| 3 | Hierbabuena | Mentha spicata | Abundante | Semi-sombra | Alta |
| 4 | Menta | Mentha | Abundante | Semi-sombra | Alta |
| 5 | Orégano | Origanum vulgare | Bajo | Sol directo | Baja |
| 6 | Orquídea | Orchidaceae | Moderado | Luz indirecta | Alta |
| 7 | Rosa China | Hibiscus rosa-sinensis | Moderado-Alto | Sol directo | Media-Alta |
| 8 | Tomate Cherry | Solanum lycopersicum var. cerasiforme | Alto | Sol directo | Media |

## Seed Script

```bash
npm run seed
```

Archivo `src/seed.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const speciesData = [
  {
    commonName: 'Ajo',
    scientificName: 'Allium sativum',
    waterRequirements: 'Riego moderado, evitar encharcamiento',
    lightRequirements: 'Sol directo al menos 6 horas diarias',
    humidityRequirements: 'Baja humedad'
  },
  // ... más especies
];

async function seed() {
  for (const species of speciesData) {
    await prisma.species.upsert({
      where: { 
        commonName_scientificName: {
          commonName: species.commonName,
          scientificName: species.scientificName
        }
      },
      update: species,
      create: species
    });
  }
}

seed();
```

## Comunicación entre Servicios

### Plants Service → Species Service
```javascript
// Validar que la especie existe
const validateSpecies = async (speciesId) => {
  try {
    const response = await axios.get(`http://species-service:3006/${speciesId}`);
    return response.data;
  } catch (error) {
    throw new Error('Invalid species');
  }
};
```

### ML Service → Species Service
```javascript
// Obtener nombre de especie por ID para predicción
const getSpeciesName = async (speciesId) => {
  const response = await axios.get(`http://species-service:3006/${speciesId}`);
  return response.data.commonName;
};
```

## Prisma Schema
```prisma
model Species {
  id                    Int      @id @default(autoincrement())
  commonName            String   @map("common_name") @db.VarChar(100)
  scientificName        String   @map("scientific_name") @db.VarChar(100)
  waterRequirements     String?  @map("water_requirements") @db.Text
  lightRequirements     String?  @map("light_requirements") @db.Text
  humidityRequirements  String?  @map("humidity_requirements") @db.Text
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@unique([commonName, scientificName])
  @@index([commonName])
  @@map("species")
}
```

## Migraciones y Seed
```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name init

# Aplicar migraciones
npx prisma migrate deploy

# Poblar base de datos
npm run seed
```

## Variables de Entorno
```env
DATABASE_URL="mysql://root:password@species-db:3306/potai_species"
PORT=3006
```

## Búsqueda
La búsqueda (`/search`) busca coincidencias en:
- Nombre común (case-insensitive)
- Nombre científico (case-insensitive)

Implementación sugerida:
```javascript
const species = await prisma.species.findMany({
  where: {
    OR: [
      { commonName: { contains: query, mode: 'insensitive' } },
      { scientificName: { contains: query, mode: 'insensitive' } }
    ]
  }
});
```
