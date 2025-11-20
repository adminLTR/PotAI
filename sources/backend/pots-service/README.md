# Pots Service

Servicio de gestión de macetas (pots). Cada maceta pertenece a un usuario y puede contener plantas.

## Puerto
- **3003**
- **Database Port:** 3309

## Base de Datos: potai_pots

### Tabla: pots
```sql
CREATE TABLE pots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  label VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_label (label)
);
```

## Endpoints

### 1. Crear Maceta
```http
POST /
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "label": "Maceta del balcón"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 123,
  "label": "Maceta del balcón",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Obtener Todas las Macetas del Usuario
```http
GET /
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 123,
    "label": "Maceta del balcón",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 3. Obtener Maceta por ID
```http
GET /:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "userId": 123,
  "label": "Maceta del balcón",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 4. Obtener o Crear Maceta
```http
POST /get-or-create
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "label": "Maceta del balcón"
}
```

**Response:**
```json
{
  "pot": {
    "id": 1,
    "userId": 123,
    "label": "Maceta del balcón",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "created": false
}
```

### 5. Actualizar Maceta
```http
PUT /:id
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "label": "Maceta del jardín"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 123,
  "label": "Maceta del jardín",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

### 6. Eliminar Maceta
```http
DELETE /:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Pot deleted successfully"
}
```

**Error si tiene plantas:**
```json
{
  "error": "Cannot delete pot with plants"
}
```

## Comunicación entre Servicios

### Plants Service → Pots Service

**Validar que la maceta existe y pertenece al usuario:**
```javascript
const axios = require('axios');

const validatePot = async (userId, potId) => {
  try {
    const response = await axios.get(`http://pots-service:3003/${potId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.userId !== userId) {
      throw new Error('Pot does not belong to user');
    }
    
    return response.data;
  } catch (error) {
    throw new Error('Invalid pot');
  }
};
```

**Obtener o crear maceta por label:**
```javascript
const getOrCreatePot = async (userId, label, token) => {
  const response = await axios.post('http://pots-service:3003/get-or-create', 
    { label },
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  
  return response.data.pot;
};
```

## Validaciones

- `label`: Opcional, máximo 255 caracteres
- Usuario autenticado requerido (validar token con Auth Service)
- Solo el propietario puede ver/modificar/eliminar sus macetas
- No se puede eliminar una maceta que tiene plantas asociadas

## Prisma Schema
```prisma
model Pot {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  label     String?  @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@index([label])
  @@map("pots")
}
```

## Migraciones
```bash
# Generar migración
npx prisma migrate dev --name init

# Aplicar migraciones
npx prisma migrate deploy
```

## Variables de Entorno
```env
DATABASE_URL="mysql://root:password@pots-db:3306/potai_pots"
PORT=3003
AUTH_SERVICE_URL=http://auth-service:3001
```
