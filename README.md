# Project Monitor — Jira Forge Custom UI App

A high-performance, centralized project management monitor built for Jira Cloud using Atlassian Forge, React, Tailwind CSS, and shadcn/ui. 

**Project Monitor** enables workspace leads and administrators to dynamically add custom metadata fields across all projects, perform inline property editing, track issue progress, and enforce fine-grained authorization.

---

## Key Features

* **Global Project Overview**: Centralized table displaying key metadata (`Key`, `Name`, `Type`, `Lead`) across all projects in the Jira workspace.
* **Dynamic Custom Fields**: Create and delete dynamic custom columns saved globally across the instance.
* **Supported Field Types**:
  * **Text** (Single line input)
  * **Number** (Numeric inputs)
  * **Date** (Native date pickers)
  * **Boolean** (Checkbox toggle flags)
* **Real-Time Work Item Progress**: Visual progress bar rendering completed (`statusCategory = Done`) vs. total issues per project.
* **Inline Property Editing**: Instant client-side property updates backed by persistent Jira Project Entity Properties.
* **Search & Interactive Sorting**: Client-side full-text search across native and custom fields with bidirectional column sorting.
* **Role-Based Access Control (RBAC)**:
  * **Schema Management**: Creating and deleting columns is restricted to Jira Global Administrators (`ADMINISTER`).
  * **Cell Editing**: Updating project properties requires Project Administrator rights (`ADMINISTER_PROJECTS`) or Global Admin status. Read-only lock visual indicators render for restricted projects.
* **Native Navigation**: Click project key chips to open projects in new tabs using `@forge/bridge` router integration.
* **Storage Debugger**: Integrated debugging modal to inspect raw Forge Storage definitions (`custom_columns`).

---

## Architecture & Data Storage Model

1. **Schema Definitions (`Forge Storage API`)**:
   * Custom column definitions (`id`, `label`, `type`) are stored at the app-installation level via `storage.set('custom_columns', ...)`.
   * Column definitions are shared globally across all users in the Jira instance.

2. **Project Property Data (`Jira Project Entity Properties`)**:
   * Value updates write directly to `/rest/api/3/project/{projectId}/properties/{key}` via Jira REST API.
   * Property expansion is handled in bulk during project search (`/rest/api/3/project/search?properties=...`), preventing N+1 REST queries on data load.

---

## Tech Stack

* **Framework**: Atlassian Forge (Custom UI)
* **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
* **Icons & Notifications**: `lucide-react`, `sonner`
* **Bridge & Resolvers**: `@forge/bridge`, `@forge/resolver`, `@forge/api`

---

## Directory Structure

```text
├── manifest.yml              # Forge app configuration & scopes
├── src/                      # Forge Backend Resolvers
│   └── index.ts              # API routes, permission guards, storage logic
└── static/frontend/          # React Custom UI Frontend
    ├── src/
    │   ├── components/       # UI Components
    │   │   ├── AddFieldModal.tsx       # Custom field creation modal
    │   │   ├── ProjectTable.tsx        # Main table, sorting, & progress bar
    │   │   ├── StorageDebugModal.tsx   # Forge storage inspection modal
    │   │   └── ui/                 # shadcn/ui base primitives
    │   ├── hooks/
    │   │   └── useProjects.ts      # Custom hook for data fetching & state management
    │   └── App.tsx                 # Master layout & search controls
    ├── tailwind.config.js
    └── package.json
```

Prerequisites
Node.js (v18 or higher recommended)

Atlassian Forge CLI installed (npm install -g @forge/cli)

Logged in to Forge CLI (forge login)

Jira Cloud development site

Installation & Setup
1. Clone & Install Dependencies

# Install backend dependencies
```bash
npm install
```

# Install frontend dependencies
```bash
cd static/frontend
npm install
cd ../..
```

2. Configure Manifest (manifest.yml)
Ensure your manifest.yml includes the required scopes for reading project data, project properties, and user permissions:

```
modules:
  macro:
    - key: project-matrix-ui
      title: Project Matrix
      react: true
  resolver:
    function: resolver-fn
    handler: index.handler
permissions:
  scopes:
    - read:jira-work
    - write:jira-work
    - manage:jira-configuration
app:
  id: ari:cloud:ecosystem::app/your-app-id-here
```

3. Build & Deploy

```bash
# Build frontend assets
cd static/frontend
npm run build
cd ../..

# Deploy to Forge development environment
forge deploy

# Install on your Jira Cloud instance
forge install
```

Permissions Overview

```text
| Action                  | Required Jira Permission              | UI Behavior if Unauthorized                                                 |
| :---------------------- | :------------------------------------ | :-------------------------------------------------------------------------- |
| **View Matrix**         | `BROWSE_PROJECTS`                     | Accessible to all instance users.                                           |
| **Manage Columns**      | `ADMINISTER` (Global Admin)           | `+ Add Field` button & column trash icons hidden. Backend throws 403 error. |
| **Edit Project Values** | `ADMINISTER_PROJECTS` or Global Admin | Cell inputs disabled with a lock indicator icon next to project name.       |
```

License
MIT