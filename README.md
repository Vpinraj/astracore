# AstraCore — AI Agent Subsidiary Dashboard

A modern, AI-powered business management dashboard for managing subsidiary companies, AI agent teams, tasks, and financial operations. Built with React + TypeScript + Vite + Tailwind CSS v4.

![AstraCore Dashboard](https://img.shields.io/badge/AstraCore-AI%20Agent%20Network-7c3aed?style=for-the-badge&logo=react)

---

## ✨ Features

- **Subsidiary Management** — Create and manage multiple subsidiary companies with seed capital, expenses, and profits tracked in real-time
- **AI Agent Squads** — Hire AI agents (CEO, CFO, CTO, Developer, etc.) for each subsidiary and assign them tasks
- **Task Execution Engine** — Deploy tasks to idle agents and watch them execute with live progress logs
- **Financial Overview** — Real-time tracking of total investments, expenses, net profits, and agent pipeline count
- **Director Agent** — Floating voice + text AI assistant to issue natural language commands across the entire organization
- **Execution Logs Terminal** — Live-streaming terminal view of all agent actions and task events
- **Light / Dark Theme** — Smooth animated theme switching with mild color palettes
- **Fully Mobile Responsive** — Hamburger drawer sidebar, adaptive grids, bottom-sheet modals

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd astracore

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (Card, Button, Badge, Modal, ProgressBar)
│   ├── Sidebar.tsx      # Navigation sidebar with mobile drawer
│   ├── Header.tsx       # Global metrics dashboard header
│   ├── Overview.tsx     # Overview tab with analytics & ledger
│   ├── SubsidiaryGrid.tsx   # Subsidiary portfolio cards grid
│   ├── SubsidiaryDetail.tsx # Drill-down view for individual subsidiary
│   ├── AgentBoard.tsx   # AI agent management board
│   ├── TaskTerminal.tsx # Live execution logs terminal
│   ├── DirectorAgent.tsx # Floating AI voice/text command assistant
│   ├── CreateModals.tsx  # Modals for creating subsidiaries, agents, and tasks
│   └── ThemeToggle.tsx  # Light/dark mode toggle widget
├── context/
│   └── AppContext.tsx    # Global application state + business logic
├── theme/
│   └── ThemeContext.tsx  # Light/dark theme provider with localStorage persistence
├── types/
│   └── index.ts         # TypeScript type definitions
├── index.css            # Tailwind CSS v4 config + custom theme variables
└── App.tsx              # Root layout component
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| Lucide React | Icon library |

---

## 🤖 Director Agent Commands

The floating Director Agent bubble (bottom-right) accepts natural language commands:

```
"create subsidiary Robotics with 50000"
"hire Developer named Jarvis for CyberCore AI"
"assign task Launch API to Jarvis"
"allocate 25000 to Nexus Media"
"status of CyberCore AI"
"overall status"
```

---

## 📄 License

MIT © AstraCore
# astracore
