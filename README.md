# ✦ OnlyNotes — AI-Powered Notes Workspace

A full-stack, AI-powered notes application built with **React** and **Express**. Create, organize, search, and analyze your notes with intelligent text analysis — all without external API keys.

---

## ✨ Features

### 📝 Notes Management
- **Create, edit & delete** notes with a clean markdown editor
- **Category-based organization** — work, personal, ideas, meetings
- **Tag system** with color-coded labels for flexible filtering
- **Archive** notes to keep your workspace clean
- **Full-text search** across titles and content

### 🤖 AI Analysis (No API Keys Required)
- **Auto-generated summaries** — get a quick overview of long notes
- **Action item extraction** — automatically pulls TODOs and tasks
- **Suggested titles** — AI recommends descriptive titles
- **Productivity insights** — writing trends and activity analytics

### 🔗 Sharing & Collaboration
- **Public sharing** via unique share links
- **Shared note viewer** — recipients see a beautiful read-only view

### 🎨 Design & UX
- **Light & Dark mode** with smooth transitions
- **Responsive layout** — works on desktop and mobile
- **Modern UI** with glassmorphism, gradients, and micro-animations
- **Google Fonts** — Inter & Outfit typography

### 🔐 Authentication
- **JWT-based auth** with signup and login
- **Protected routes** — session persists via localStorage

---

## 🛠️ Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 18, React Router 6, Vite 5              |
| Backend    | Express 4, Node.js                            |
| Database   | SQLite (better-sqlite3)                       |
| Auth       | JWT (jsonwebtoken), bcryptjs                  |
| AI         | Built-in text analysis (no external APIs)     |
| Styling    | Vanilla CSS with custom properties            |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ 
- **npm** v9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/snehasuresh2005/OnlyNotes.git
   cd OnlyNotes
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example server/.env
   ```
   Edit `server/.env` and set your JWT secret:
   ```
   PORT=3001
   JWT_SECRET=your_secure_secret_here
   ```

4. **Seed the database** (optional — adds sample notes)
   ```bash
   cd server
   node seed.js
   ```

5. **Start the app**
   ```bash
   npm run dev
   ```

   This starts both servers concurrently:
   - **Frontend** → http://localhost:5173
   - **Backend** → http://localhost:3001

---

## 📁 Project Structure

```
OnlyNotes/
├── client/                  # React frontend (Vite)
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # Reusable UI components
│       │   └── Sidebar.jsx
│       ├── contexts/        # React contexts
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── pages/           # Route pages
│       │   ├── DashboardPage.jsx
│       │   ├── EditorPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── NotesPage.jsx
│       │   ├── SharedPage.jsx
│       │   └── SignupPage.jsx
│       ├── services/        # API client
│       │   └── api.js
│       ├── App.jsx
│       ├── index.css        # Design system
│       └── main.jsx
├── server/                  # Express backend
│   ├── data/                # SQLite database
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js  # Schema & connection
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js      # Signup / Login
│   │   │   ├── notes.js     # CRUD + search + AI
│   │   │   ├── tags.js      # Tag management
│   │   │   ├── shared.js    # Public share links
│   │   │   └── insights.js  # Productivity analytics
│   │   ├── services/
│   │   │   └── aiService.js # Built-in text analysis
│   │   └── index.js         # Server entry point
│   └── seed.js              # Database seeder
├── package.json             # Root scripts
└── .env.example             # Environment template
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| POST   | `/api/auth/signup` | Register new user |
| POST   | `/api/auth/login`  | Login             |
| GET    | `/api/auth/me`     | Get current user  |

### Notes (Protected)
| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/api/notes`                | List notes (with search) |
| POST   | `/api/notes`                | Create a note            |
| GET    | `/api/notes/:id`            | Get a single note        |
| PUT    | `/api/notes/:id`            | Update a note            |
| DELETE | `/api/notes/:id`            | Delete a note            |
| POST   | `/api/notes/:id/analyze`    | Run AI analysis          |
| POST   | `/api/notes/:id/share`      | Generate share link      |

### Tags (Protected)
| Method | Endpoint        | Description    |
| ------ | --------------- | -------------- |
| GET    | `/api/tags`     | List all tags  |
| POST   | `/api/tags`     | Create a tag   |
| DELETE | `/api/tags/:id` | Delete a tag   |

### Insights (Protected)
| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| GET    | `/api/insights`  | Productivity analytics   |

### Shared (Public)
| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| GET    | `/api/shared/:shareId` | View a shared note  |

---

## 📜 Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Start both client & server             |
| `npm run dev:client` | Start frontend only                    |
| `npm run dev:server` | Start backend only                     |
| `npm run install:all`| Install all dependencies               |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
