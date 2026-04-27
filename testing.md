# Fullstack Testing Setup: The Testing Trophy Approach

This document outlines the testing architecture for our React 19.2.4 frontend and Koa 2.x backend. We utilize the **Testing Trophy** methodology to ensure high confidence and rapid execution by focusing primarily on integration and component tests, supported by static typing and end-to-end (E2E) verification.

---

## 1. Directory Structure

We separate tests based on their execution context. Unit and component tests live next to the code they test, while E2E and backend integration tests have their own dedicated directories.

```text
/project-root
│
├── /frontend
│   ├── /e2e                        # Playwright: End-to-End tests
│   │   └── auth.spec.ts            
│   └── /src
│       ├── /components
│       │   ├── Button.tsx
│       │   └── Button.test.tsx     # Vitest + RTL: Component tests
│       └── setupTests.ts           # Vitest setup (DOM matchers)
│
├── /backend
│   ├── /src
│   │   ├── /middleware
│   │   │   ├── auth.ts
│   │   │   └── auth.test.ts        # Vitest + Koa Mocks: Unit tests
│   │   └── index.ts                # Koa app entry point
│   └── /tests                      
│       └── api.integration.test.ts # Vitest + Supertest: API Integration 
│
└── package.json                    # Root or workspace configuration