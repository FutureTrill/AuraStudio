# Aura Studio AI

Aura Studio AI is a high-performance, professional-grade web application designed for rapid website prototyping and development. By leveraging natural language processing through the **Aura_Core** engine, it allows developers and designers to build fully functional, responsive websites simply by describing them.

## 🚀 Core Functionality

Aura Studio acts as an intelligent IDE that bridges the gap between conceptual design and production-ready code. Users can enter design commands, view live visual renders, and export clean, semantic source code in real-time.

### Key Features

- **Aura_Core Neural Engine**: Utilizes advanced LLM logic to translate natural language into structured HTML5, Tailwind CSS, and JavaScript.
- **Dual-Pane Workspace**:
  - **Visualizer**: A real-time sandboxed environment to see your website come to life.
  - **Source Viewer**: Instant access to the generated code with copy and download capabilities.
- **Intelligent History Archive**: Cloud-synced project history that allows you to revisit, iterate, and update previous builds.
- **Engine Switching**: Support for multiple processing engines (Aura_Core and Aura_Pro) to handle different design complexities.
- **Usage Quota Management**: Built-in session tracking to manage resource consumption across guest and registered users.
- **Retro-Modern Aesthetics**: A professional, distraction-free "Studio" interface inspired by classic high-end engineering software.

## 🛠 Tech Stack

- **Frontend**: React (v19), TypeScript, Tailwind CSS.
- **Routing**: React Router (Memory Mode for seamless studio transitions).
- **AI Integration**: Google Gemini API (Aura_Core).
- **Backend & Auth**: Supabase (PostgreSQL, GoTrue).
- **Icons**: Lucide Icons.

## 📂 Project Structure

```text
├── pages/
│   ├── LandingPage.tsx   # Entry point and neural handshake
│   ├── AuthPage.tsx      # Secure access and registration
│   └── StudioPage.tsx    # The core IDE workspace
├── services/
│   ├── gemini.ts         # AI engine logic and prompt engineering
│   └── storage.ts        # Database interaction layer
├── lib/
│   └── supabase.ts       # Backend connection configuration
└── types.ts              # Global type definitions
```

## 🔌 Backend Integration

Aura Studio is built with a "Frontend First" philosophy but includes explicit integration points for a complete backend ecosystem.

1.  **Authentication**: Integrated with Supabase Auth for identity management.
2.  **Database**: Designed to work with two primary tables: `profiles` (for usage limits) and `projects` (for storing code and chat context).
3.  **Storage**: The `storage.ts` service handles all CRUD operations for user projects.
