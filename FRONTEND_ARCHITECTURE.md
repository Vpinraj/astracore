# AstraCore — Frontend Architecture

> **Stack**: React 19 · TypeScript 6 · Vite 8 · Redux Toolkit · Redux-Saga · TailwindCSS 4 · Lucide React

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Diagram](#4-architecture-diagram)
5. [State Management Architecture](#5-state-management-architecture)
6. [Data Flow — Redux-Saga Pipeline](#6-data-flow--redux-saga-pipeline)
7. [Component Architecture](#7-component-architecture)
8. [Routing & Navigation](#8-routing--navigation)
9. [API Layer](#9-api-layer)
10. [Type System](#10-type-system)
11. [Theme System](#11-theme-system)
12. [Simulation Loop](#12-simulation-loop)
13. [Key Workflows](#13-key-workflows)
14. [Domain Modules](#14-domain-modules)

---

## 1. Overview

AstraCore's frontend is a **single-page application (SPA)** that acts as a real-time command center for an AI-powered multi-subsidiary business simulator. It communicates with a .NET 10 backend over REST, managing live agent simulations, financial transactions, CRM leads, task queues, and product catalogs — all updating in real time through a polling tick loop.

```
┌─────────────────────────────────────────────────────────┐
│                  AstraCore Frontend SPA                  │
│                                                         │
│   React 19 + TypeScript + Vite 8                        │
│                                                         │
│   ┌───────────┐   ┌──────────────────────────────────┐  │
│   │  Redux    │   │        React Components           │  │
│   │  Store    │◄──│  (Sidebar · Header · Tab Pages)   │  │
│   │  (RTK)    │   └──────────────────────────────────┘  │
│   └─────┬─────┘                                         │
│         │ redux-saga                                     │
│   ┌─────▼─────┐                                         │
│   │ API Layer │──── fetch ────► .NET Core API (5035)     │
│   └───────────┘                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.6 | UI rendering engine |
| **TypeScript** | ~6.0.2 | Static typing & developer experience |
| **Vite** | 8.0 | Build tool & HMR dev server |
| **Redux Toolkit (RTK)** | 2.12 | Global state management |
| **Redux-Saga** | 1.5 | Async side-effects (API calls) |
| **TailwindCSS** | 4.3 | Utility-first CSS styling |
| **Lucide React** | 1.21 | Icon library |
| **react-redux** | 9.3 | React bindings for Redux |

---

## 3. Project Structure

```
src/
├── main.tsx                  # Entry point — mounts <App /> to DOM
├── App.tsx                   # Root component — Redux Provider + DashboardLayout
├── App.css                   # Global component-level styles
├── index.css                 # Global base styles & CSS variables
├── api.ts                    # Centralized REST API client (fetch wrappers)
│
├── types/
│   └── index.ts              # All TypeScript interfaces & constants
│                             # (Subsidiary, Agent, Task, Lead, Employee, etc.)
│
├── store/
│   ├── index.ts              # Store configuration (RTK + Saga middleware)
│   ├── hooks.ts              # Typed useAppDispatch / useAppSelector hooks
│   ├── slices/               # RTK state slices (reducers + actions)
│   │   ├── coreSlice.ts      # App-level state (loading, tick, command parsing)
│   │   ├── subsidiarySlice.ts
│   │   ├── agentSlice.ts     # Agents + Role Blueprints
│   │   ├── taskSlice.ts
│   │   ├── financeSlice.ts   # Transactions
│   │   └── crmSlice.ts       # Leads + Employees
│   └── sagas/                # Side-effect handlers (API calls)
│       ├── index.ts           # Root saga (forks all domain sagas)
│       ├── coreSaga.ts        # fetchState, tick, reset, command parse
│       ├── subsidiarySaga.ts
│       ├── agentSaga.ts
│       ├── taskSaga.ts
│       ├── financeSaga.ts
│       └── crmSaga.ts
│
├── components/
│   ├── Sidebar.tsx            # Left nav — tab switching
│   ├── Header.tsx             # Top bar — system metrics
│   ├── Overview.tsx           # Home dashboard with KPIs
│   ├── SubsidiaryGrid.tsx     # Card grid of all subsidiaries
│   ├── SubsidiaryDetail.tsx   # Full detail view for one subsidiary
│   ├── AgentBoard.tsx         # Agent cards with status indicators
│   ├── RoleRegistry.tsx       # Dynamic role blueprints CRUD
│   ├── TaskBoard.tsx          # Task table with filters + status
│   ├── TaskTerminal.tsx       # Director NLP command terminal
│   ├── QuestionBoard.tsx      # Agent <-> User Q&A interface
│   ├── AgentChatWindow.tsx    # Chat drawer for direct agent interaction
│   ├── BalanceSheet.tsx       # Transaction ledger viewer
│   ├── CreateTransactionModal.tsx
│   ├── LeadCRM.tsx            # CRM kanban/pipeline for leads
│   ├── EmployeeDirectory.tsx  # Human staff directory
│   ├── OrgTree.tsx            # Organizational hierarchy tree
│   ├── CatalogBoard.tsx       # Product catalog with file upload
│   ├── CreateModals.tsx       # Subsidiary / Agent / Task create forms
│   ├── ThemeToggle.tsx        # Dark/light theme switcher
│   └── ui/                   # Shared reusable UI primitives
│
└── theme/
    └── ThemeContext.tsx       # React Context for dark/light mode
```

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT APPLICATION                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  App.tsx                                                     │   │
│  │  ┌────────────────┐  ┌───────────────────────────────────┐  │   │
│  │  │  ThemeProvider │  │         Redux <Provider>          │  │   │
│  │  │  (CSS vars +   │  │  ┌─────────────────────────────┐  │  │   │
│  │  │   context)     │  │  │      DashboardLayout         │  │  │   │
│  │  └────────────────┘  │  │                             │  │  │   │
│  │                      │  │  ┌────────┐  ┌──────────┐  │  │  │   │
│  │                      │  │  │Sidebar │  │ Header   │  │  │  │   │
│  │                      │  │  │(Nav)   │  │(Metrics) │  │  │  │   │
│  │                      │  │  └────────┘  └──────────┘  │  │  │   │
│  │                      │  │                             │  │  │   │
│  │                      │  │  ┌──────────────────────┐  │  │  │   │
│  │                      │  │  │   Tab Content Area   │  │  │  │   │
│  │                      │  │  │  (renderTabContent)  │  │  │  │   │
│  │                      │  │  │                      │  │  │  │   │
│  │                      │  │  │  Overview            │  │  │  │   │
│  │                      │  │  │  SubsidiaryGrid/Det  │  │  │  │   │
│  │                      │  │  │  AgentBoard/Roles    │  │  │  │   │
│  │                      │  │  │  TaskBoard           │  │  │  │   │
│  │                      │  │  │  CatalogBoard        │  │  │  │   │
│  │                      │  │  │  LeadCRM             │  │  │  │   │
│  │                      │  │  │  EmployeeDir/OrgTree │  │  │  │   │
│  │                      │  │  │  TaskTerminal        │  │  │  │   │
│  │                      │  │  └──────────────────────┘  │  │  │   │
│  │                      │  │  ┌──────────────────────┐  │  │  │   │
│  │                      │  │  │   AgentChatWindow    │  │  │  │   │
│  │                      │  │  │   (global overlay)   │  │  │  │   │
│  │                      │  │  └──────────────────────┘  │  │  │   │
│  │                      │  └─────────────────────────────┘  │  │   │
│  │                      └───────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. State Management Architecture

AstraCore uses **Redux Toolkit (RTK)** for predictable state management with **Redux-Saga** for handling asynchronous operations.

### Redux Store Shape

```typescript
{
  core: {
    loading: boolean;        // Global loading flag
    error: string | null;    // Global error message
    tickLoading: boolean;    // Tick-in-flight flag
    logs: ActivityLog[];     // Live activity feed
    config: AppConfig | null;
  },
  subsidiaries: {
    list: Subsidiary[];
  },
  agents: {
    list: Agent[];
    roles: RoleBlueprint[];  // Dynamic role blueprints
  },
  tasks: {
    list: Task[];
  },
  finance: {
    transactions: Transaction[];
  },
  crm: {
    leads: Lead[];
    employees: Employee[];
  }
}
```

### Slice Architecture

Each domain slice follows the same RTK pattern:

```
┌──────────────────────────────────────────────────────┐
│                  Redux Slice (e.g. taskSlice)         │
│                                                      │
│  Actions (auto-generated):                           │
│    fetchTasksRequest → fetchTasksSuccess/Failure     │
│    createTaskRequest → createTaskSuccess/Failure     │
│                                                      │
│  Reducers:                                           │
│    setTasks(state, action) => state.list = payload   │
│                                                      │
│  State:                                              │
│    { list: Task[], loading, error }                  │
└──────────────────────────────────────────────────────┘
```

---

## 6. Data Flow — Redux-Saga Pipeline

```
User Action (click / form submit)
        │
        ▼
dispatch(action)         ← React Component
        │
        ▼
Redux Slice              ← sets loading: true
        │
        ▼
Redux-Saga intercepts    ← takeLatest(action.type, sagaFn)
        │
        ▼
yield call(api.fn)       ← fetch() to .NET Core API
        │
        ├─► Success ──► yield put(setSliceData(data))
        │               yield put(actionSuccess())
        │
        └─► Failure ──► yield put(actionFailure(error.message))
```

### State Hydration Flow (fetchState + tick)

```
DashboardLayout mounts
       │
       ▼
dispatch(fetchStateRequest())
       │
       ▼
GET /api/simulation/state
       │
       ▼
Backend returns SimulationState {
  subsidiaries, agents, tasks,
  transactions, leads, employees,
  catalog, roleBlueprints, logs
}
       │
       ▼  (saga dispatches setters to all slices)
setSubsidiaries | setAgents | setTasks | setTransactions
setLeads | setEmployees | setRoles
       │
       ▼
All components re-render with fresh data

setInterval(dispatch(tickRequest()), 2000ms)  ← auto-loop
```

---

## 7. Component Architecture

### Layout Hierarchy

```
App
├── ThemeProvider (context)
└── Redux Provider (store)
    └── DashboardLayout
        ├── Sidebar             ← tab navigation
        ├── main (content area)
        │   ├── Header          ← system-wide metrics
        │   └── [Tab Content]   ← rendered by renderTabContent()
        │       ├── Overview
        │       ├── SubsidiaryGrid / SubsidiaryDetail
        │       ├── AgentBoard + RoleRegistry (sub-tabs)
        │       ├── TaskBoard
        │       ├── CatalogBoard
        │       ├── QuestionBoard
        │       ├── TaskTerminal
        │       ├── LeadCRM
        │       └── EmployeeDirectory + OrgTree (sub-tabs)
        └── AgentChatWindow     ← global floating overlay
```

### Tab Types

```typescript
type TabType =
  | 'overview'
  | 'subsidiaries'
  | 'agents'
  | 'tasks'
  | 'catalog'
  | 'questions'
  | 'terminal'
  | 'leads'
  | 'team';
```

Sub-tabs: `agents → 'agents' | 'blueprints'`, `team → 'directory' | 'org'`

---

## 8. Routing & Navigation

AstraCore uses **tab-based navigation** (no React Router):

```
Sidebar tab click
       │
       ▼
handleTabChange(tab: TabType)
       │
       ├─ setActiveTab(tab)       → re-renders content area
       └─ setSelectedSubsidiary(null)  ← clears detail view

renderTabContent() switch(activeTab)
       └─ returns matching component JSX
```

**Subsidiary Drill-Down**: `SubsidiaryGrid` card click → `setSelectedSubsidiary(sub)` → renders `SubsidiaryDetail` instead of grid.

---

## 9. API Layer

All HTTP communication centralized in `src/api.ts`.

```typescript
export const API_BASE_URL = 'http://localhost:5035/api';
```

| Category | Methods | Key Endpoints |
|---|---|---|
| Simulation | `fetchState`, `tick`, `resetState` | `/simulation/state`, `/simulation/tick` |
| Subsidiary | `createSubsidiary`, `allocateFunds` | `/simulation/subsidiary` |
| Agent | `createAgent`, `chatWithAgent` | `/simulation/agent`, `/chat` |
| Task | `createTask`, `startTask`, `answerQuestion` | `/simulation/task`, `/simulation/start-task` |
| Finance | `createTransaction` | `/simulation/transaction` |
| CRM | `createLead`, `updateLeadStage`, `deleteLead` | `/leads/*` |
| Catalog | `fetchCatalog`, `addItem`, `uploadCatalog` | `/catalog/*` |
| Roles | `fetchRoles`, `createRole` | `/simulation/roles` |
| Director | `parseDirectorCommand` | `/simulation/command` |

### File Upload (Catalog)

```typescript
uploadCatalog: async (formData: FormData) => {
  // multipart/form-data - browser sets boundary automatically
  return fetch(`${API_BASE_URL}/catalog/upload`, {
    method: 'POST', body: formData
  });
}
```

---

## 10. Type System

All domain types in `src/types/index.ts` mirror C# entity models 1-to-1:

```
TypeScript Interface     ←→     C# Entity Class
────────────────────────────────────────────────
Subsidiary               ←→     Subsidiary
Agent                    ←→     Agent
Task                     ←→     TaskItem
ActivityLog              ←→     ActivityLog
Transaction              ←→     Transaction
Lead                     ←→     Lead
Employee                 ←→     Employee
CatalogItem              ←→     CatalogItem
RoleBlueprint            ←→     RoleBlueprint
```

### Key Union Types

```typescript
type AgentStatus       = 'idle' | 'thinking' | 'working' | 'resting'
type TaskStatus        = 'pending' | 'in_progress' | 'completed' | 'blocked_on_user'
type LeadStage         = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost'
type AgentOutputFormat = 'markdown' | 'json' | 'plain' | 'code'
type AgentMemoryType   = 'none' | 'short_term' | 'long_term'
```

---

## 11. Theme System

```
ThemeContext (React Context)
       │
       ├─ theme: 'dark' | 'light'
       ├─ toggleTheme()
       └─ applies class to <html>
              │
              └─ TailwindCSS 4 dark: variants apply
```

---

## 12. Simulation Loop

```
DashboardLayout mounts
       │
       ├─ fetchStateRequest() → initial data load
       │
       └─ setInterval(tickRequest(), 2000ms)
              │
              └─ POST /api/simulation/tick
                     │
                     └─ Backend:
                          • Agents advance tasks
                          • Status transitions
                          • Logs written
                          • Balances updated
                     │
                     └─ Returns SimulationState
                            └─ All Redux slices updated
                                   └─ UI re-renders
```

---

## 13. Key Workflows

### A. Create Agent

```
User fills form → dispatch(createAgentRequest)
→ api.createAgent() → POST /api/simulation/agent
→ dispatch(fetchStateRequest()) → AgentBoard updates
```

### B. Task Execution

```
User starts task → api.startTask(taskId)
→ POST /api/simulation/start-task
→ Backend: LLM inference via SemanticKernel
→ Next tick returns updated task (progress, logs, output)
→ TaskBoard shows live progress
```

### C. Director NLP Command

```
User types: "Hire a Developer named Alice for TechCore"
→ dispatch(parseCommandRequest({ command }))
→ POST /api/simulation/command
→ Backend: DirectorCommandExecutor matches handler
→ Action executed → fetchStateRequest() → UI updates
```

### D. Catalog File Upload

```
User drops file (Excel/CSV/image)
→ FormData → api.uploadCatalog(formData)
→ POST /api/catalog/upload
→ Backend: DocumentParserHelper parses rows
→ CatalogItem records saved → catalog table refreshed
```

---

## 14. Domain Modules

| Module | Components | Slice | Features |
|---|---|---|---|
| Overview | `Overview.tsx` | all slices | KPI cards, activity log feed |
| Subsidiaries | `SubsidiaryGrid`, `SubsidiaryDetail` | `subsidiarySlice` | Cards, detail view with embedded data |
| Agents | `AgentBoard`, `RoleRegistry` | `agentSlice` | Status cards, blueprint CRUD |
| Tasks | `TaskBoard`, `QuestionBoard`, `TaskTerminal` | `taskSlice` | Table + filters, Q&A, NLP terminal |
| Finance | `BalanceSheet`, `CreateTransactionModal` | `financeSlice` | Ledger, GST breakdown |
| CRM | `LeadCRM` | `crmSlice` | Pipeline stages, follow-up notes |
| Team | `EmployeeDirectory`, `OrgTree` | `crmSlice` | Staff cards, reversed hierarchy tree |
| Catalog | `CatalogBoard` | via API | Product table, file upload parser |

---

## Development Quick Reference

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:5173
npx tsc --noEmit    # Type check only
npm run lint         # ESLint check
npm run build        # Production bundle
```

> **Note**: Backend must be running on `http://localhost:5035`. See `BACKEND_ARCHITECTURE.md`.
