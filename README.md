# Digi-Pets Split

A full-stack digital pet game inspired by Digimon, featuring a secure REST API server and a cross-platform web client.

## 🎮 Features

- **Create and manage digital pets** with various species (Agumon, Gabumon, Patamon, Tailmon, Tentomon)
- **Interactive gameplay** - Feed, play with, and rest your pets
- **Dynamic stat system** - Health, hunger, happiness, energy, and experience
- **Level progression** - Pets gain experience and level up
- **Real-time stat updates** - Stats change based on time and interactions
- **Responsive web interface** - Works on desktop, tablet, and mobile
- **Docker containerized** - Easy deployment and scaling

## 🏗️ Architecture

### Server
- **Node.js + Express** - RESTful API server
- **TypeScript** - Type-safe code
- **In-memory data store** - Simple and fast (can be extended with a database)
- **Security features** - Helmet, CORS, rate limiting
- **Input validation** - Comprehensive request validation
- **Docker containerized** - Production-ready deployment

### Client
- **React + TypeScript** - Modern web framework
- **Vite** - Fast build tool and development server
- **Responsive design** - Mobile-friendly interface
- **Docker + Nginx** - Optimized production deployment

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/Gameaday/digi-pets-split.git
cd digi-pets-split
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Client: http://localhost
- Server API: http://localhost:3000/api
- Health check: http://localhost:3000/health

### Manual Setup

#### Server

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Run in development mode:
```bash
npm run dev
```

5. Or build and run in production:
```bash
npm run build
npm start
```

#### Client

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Run in development mode:
```bash
npm run dev
```

5. Or build for production:
```bash
npm run build
npm run preview
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Get Available Species
```http
GET /species
```

Response:
```json
{
  "success": true,
  "data": ["Agumon", "Gabumon", "Patamon", "Tailmon", "Tentomon"]
}
```

#### Create Pet
```http
POST /pets
Content-Type: application/json

{
  "name": "Agumon Jr.",
  "species": "Agumon"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
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

#### Get All Pets
```http
GET /pets
```

#### Get Single Pet
```http
GET /pets/:id
```

#### Feed Pet
```http
POST /pets/:id/feed
```

Cooldown: 5 minutes

#### Play with Pet
```http
POST /pets/:id/play
```

Cooldown: 3 minutes
Requires: Energy >= 20

#### Rest Pet
```http
POST /pets/:id/rest
```

Cooldown: 10 minutes

#### Delete Pet
```http
DELETE /pets/:id
```

### Error Responses

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🎯 Game Mechanics

### Stats
- **Health (0-100)**: Overall wellbeing of the pet
- **Hunger (0-100)**: How full the pet is (decreases over time)
- **Happiness (0-100)**: Pet's mood (affected by hunger and play)
- **Energy (0-100)**: Pet's stamina (decreased by playing, restored by resting)
- **Experience**: Gained through actions, used for leveling up

### Actions
- **Feed**: Increases hunger and health (5 min cooldown)
- **Play**: Increases happiness, decreases energy and hunger (3 min cooldown)
- **Rest**: Restores energy and health (10 min cooldown)

### Progression
- Pets gain experience from all actions
- Level up when experience reaches level * 100
- Level ups provide stat boosts

### Time-based Changes
- Hunger decreases over time
- Low hunger affects happiness
- Very low hunger affects health
- Age increases in real-time

## 🧪 Testing

### Server Tests
```bash
cd server
npm test
```

### Linting
```bash
# Server
cd server
npm run lint

# Client
cd client
npm run lint
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Controlled cross-origin access
- **Rate limiting** - Prevents API abuse
- **Input validation** - Sanitizes all inputs
- **Type safety** - TypeScript throughout

## 📱 Cross-Platform Support

The web client works on:
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Android Chrome)
- ✅ Tablets
- ✅ Can be wrapped for mobile apps (React Native, Capacitor, or Cordova)

### Converting to Mobile Apps

To deploy to app stores, you can use:

1. **Capacitor** (Recommended):
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

2. **React Native Web**: Migrate components to React Native

3. **Progressive Web App (PWA)**: Add service workers for offline support

## 🐳 Docker Deployment

### Single Container
```bash
# Server only
cd server
docker build -t digi-pets-server .
docker run -p 3000:3000 digi-pets-server

# Client only
cd client
docker build -t digi-pets-client .
docker run -p 80:80 digi-pets-client
```

### Full Stack with Docker Compose
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## 🔧 Environment Variables

### Server (.env)
```bash
PORT=3000
CORS_ORIGIN=*
NODE_ENV=production
```

### Client (.env)
```bash
VITE_API_URL=http://localhost:3000/api
```

## 📈 Future Enhancements

- [ ] User authentication and accounts
- [ ] Persistent database (PostgreSQL/MongoDB)
- [ ] Pet evolution system
- [ ] Multiplayer battles
- [ ] Trading system
- [ ] Achievement system
- [ ] WebSocket for real-time updates
- [ ] Mobile native apps (iOS/Android)
- [ ] Pet breeding system
- [ ] More species and items

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👥 Authors

Created for the Digi-Pets project