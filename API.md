# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required. Future versions will include user authentication.

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Applies to all `/api` endpoints

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Endpoints

### Health Check

Check if the server is running.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T16:00:00.000Z"
}
```

---

### Get Available Species

Retrieve all available pet species.

```http
GET /api/species
```

**Response:**
```json
{
  "success": true,
  "data": [
    "Agumon",
    "Gabumon",
    "Patamon",
    "Tailmon",
    "Tentomon"
  ]
}
```

---

### Create Pet

Create a new pet.

```http
POST /api/pets
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Agumon Jr.",
  "species": "Agumon"
}
```

**Validation:**
- `name`: Required, non-empty string
- `species`: Required, must be one of the available species

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Agumon Jr.",
    "species": "Agumon",
    "level": 1,
    "experience": 0,
    "hunger": 50,
    "happiness": 50,
    "health": 100,
    "energy": 100,
    "age": 0,
    "createdAt": "2025-11-07T16:00:00.000Z",
    "lastFed": "2025-11-07T16:00:00.000Z",
    "lastPlayed": "2025-11-07T16:00:00.000Z",
    "lastSlept": "2025-11-07T16:00:00.000Z"
  }
}
```

**Error Codes:**
- `400`: Invalid input (missing name, invalid species)

---

### Get All Pets

Retrieve all pets. Stats are automatically updated based on time elapsed.

```http
GET /api/pets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Agumon Jr.",
      "species": "Agumon",
      "level": 2,
      "experience": 45,
      "hunger": 45,
      "happiness": 60,
      "health": 95,
      "energy": 80,
      "age": 2,
      "createdAt": "2025-11-07T14:00:00.000Z",
      "lastFed": "2025-11-07T15:30:00.000Z",
      "lastPlayed": "2025-11-07T15:45:00.000Z",
      "lastSlept": "2025-11-07T14:30:00.000Z"
    }
  ]
}
```

---

### Get Single Pet

Retrieve a specific pet by ID.

```http
GET /api/pets/:id
```

**Parameters:**
- `id`: Pet UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Agumon Jr.",
    ...
  }
}
```

**Error Codes:**
- `404`: Pet not found

---

### Feed Pet

Feed a pet to increase hunger and health.

```http
POST /api/pets/:id/feed
```

**Parameters:**
- `id`: Pet UUID

**Cooldown:** 5 minutes since last feed

**Effects:**
- Hunger: +30 (max 100)
- Health: +5 (max 100)
- Experience: +10

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "hunger": 80,
    "health": 100,
    "experience": 10,
    ...
  }
}
```

**Error Codes:**
- `400`: Pet is not hungry yet (cooldown active)
- `404`: Pet not found

---

### Play with Pet

Play with a pet to increase happiness.

```http
POST /api/pets/:id/play
```

**Parameters:**
- `id`: Pet UUID

**Cooldown:** 3 minutes since last play  
**Requirements:** Energy >= 20

**Effects:**
- Happiness: +25 (max 100)
- Energy: -15
- Hunger: -10
- Experience: +15

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "happiness": 75,
    "energy": 65,
    "hunger": 40,
    "experience": 25,
    ...
  }
}
```

**Error Codes:**
- `400`: Pet is too tired to play (energy < 20)
- `400`: Pet needs a break (cooldown active)
- `404`: Pet not found

---

### Rest Pet

Let a pet rest to restore energy and health.

```http
POST /api/pets/:id/rest
```

**Parameters:**
- `id`: Pet UUID

**Cooldown:** 10 minutes since last rest

**Effects:**
- Energy: +40 (max 100)
- Health: +10 (max 100)
- Experience: +5

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "energy": 90,
    "health": 100,
    "experience": 30,
    ...
  }
}
```

**Error Codes:**
- `400`: Pet is not tired yet (cooldown active)
- `404`: Pet not found

---

### Delete Pet

Delete (release) a pet permanently.

```http
DELETE /api/pets/:id
```

**Parameters:**
- `id`: Pet UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Pet deleted successfully"
  }
}
```

**Error Codes:**
- `404`: Pet not found

---

## Game Mechanics

### Stats

All stats are capped between 0 and 100 (except experience and level).

- **Health**: Overall wellbeing
- **Hunger**: How full the pet is (decreases ~2 points per hour)
- **Happiness**: Mood (decreases if hunger < 30)
- **Energy**: Stamina for activities
- **Experience**: Points for leveling up
- **Level**: Pet's current level (starts at 1)
- **Age**: Hours since creation

### Automatic Stat Changes

Stats update automatically based on time:

1. **Hunger** decreases by ~2 points per hour
2. **Happiness** decreases if hunger is below 30
3. **Health** decreases if hunger is below 20 (~0.5 per hour)
4. **Age** increases in real-time (measured in hours)

### Level Up System

- Required XP = Current Level × 100
- When XP threshold is reached:
  - Level increases by 1
  - Excess XP carries over
  - Health +10 (capped at 100)
  - Happiness +10 (capped at 100)

### Cooldowns

Actions have cooldowns to prevent spam:

| Action | Cooldown |
|--------|----------|
| Feed   | 5 min    |
| Play   | 3 min    |
| Rest   | 10 min   |

## Error Handling

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400  | Bad Request - Invalid input or action not allowed |
| 404  | Not Found - Resource doesn't exist |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

## Examples

### Example: Create and Care for a Pet

```javascript
// 1. Get available species
GET /api/species

// 2. Create a new pet
POST /api/pets
{
  "name": "My Agumon",
  "species": "Agumon"
}

// 3. Wait 5 minutes...

// 4. Feed the pet
POST /api/pets/{pet-id}/feed

// 5. Wait 3 minutes...

// 6. Play with the pet
POST /api/pets/{pet-id}/play

// 7. Check pet status
GET /api/pets/{pet-id}
```

### Example: Using cURL

```bash
# Create a pet
curl -X POST http://localhost:3000/api/pets \
  -H "Content-Type: application/json" \
  -d '{"name": "Agumon Jr.", "species": "Agumon"}'

# Get all pets
curl http://localhost:3000/api/pets

# Feed a pet
curl -X POST http://localhost:3000/api/pets/{pet-id}/feed

# Delete a pet
curl -X DELETE http://localhost:3000/api/pets/{pet-id}
```

### Example: JavaScript/TypeScript Client

```typescript
const API_URL = 'http://localhost:3000/api';

async function createPet(name: string, species: string) {
  const response = await fetch(`${API_URL}/pets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, species })
  });
  return response.json();
}

async function getPets() {
  const response = await fetch(`${API_URL}/pets`);
  return response.json();
}

async function feedPet(id: string) {
  const response = await fetch(`${API_URL}/pets/${id}/feed`, {
    method: 'POST'
  });
  return response.json();
}
```

## Best Practices

1. **Always check the `success` field** in responses
2. **Handle errors gracefully** by checking the `error` field
3. **Respect cooldowns** to avoid 400 errors
4. **Update pet stats** regularly by fetching pet data
5. **Store pet IDs** securely for later reference
6. **Don't spam the API** - respect rate limits

## Future API Endpoints

Planned for future releases:

- `POST /api/users` - Create user account
- `POST /api/login` - User authentication
- `GET /api/users/:id/pets` - Get pets for a specific user
- `POST /api/pets/:id/evolve` - Evolve pet to next form
- `POST /api/battle` - Battle between two pets
- `GET /api/items` - Get available items
- `POST /api/pets/:id/use-item` - Use item on pet
