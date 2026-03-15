# Droppin Codebase Agent Memory

This file is a high-signal technical orientation for agents working in this repository.
It is intended to reduce re-discovery time and prevent regressions across backend/frontend/Shopify integration flows.

## 1. What This Codebase Is

Droppin is a multi-surface delivery platform with:
- `backend/`: Node.js + Express + Sequelize (MySQL) API and business logic.
- `frontend/`: React (CRA) web app for Admin, Shop, Driver, and public tracking pages.
- `droppin-eg/`: Shopify embedded app (Remix) that sends Shopify orders into Droppin and supports fulfillment integration.
- `backend/translation-service/`: Python FastAPI microservice for EN->AR translation used by backend translation proxy workflows.
- `docs/`: operational and integration docs (maintenance mode, Shopify fulfillment, nginx snippets).

Main server startup is in `backend/server.js`.

## 2. Top-Level Architecture and Boundaries

### Backend API (`backend/`)
- Express app in `backend/server.js`.
- Route mounts include:
  - `/api/auth`, `/api/users`, `/api/shops`, `/api/drivers`, `/api/packages`, `/api/admin`, `/api/pickups`, `/api/items`, `/api/notifications`.
  - `/webhooks` is mounted before `express.json()` to preserve raw body for HMAC checks.
- Auth styles:
  - JWT auth via `backend/middleware/auth.middleware.js`.
  - API key auth via `backend/middleware/apiKeyAuth.js`.
  - Hybrid auth via `backend/middleware/combinedAuth.js` (Bearer token can be either shop API key or JWT).

### Frontend (`frontend/`)
- Entry and bootstrap in `frontend/src/index.js`.
- Routes in `frontend/src/App.js`.
- Role-protected areas:
  - `/admin/*` -> admin dashboard (`frontend/src/pages/Admin/Dashboard.js`).
  - `/shop/*` -> shop dashboard/pages.
  - `/driver/*` -> driver dashboard/pages.
- i18n resources loaded in `frontend/src/i18n.js` from `frontend/src/locales/{en,ar}`.

### Shopify app (`droppin-eg/`)
- Remix app with Shopify auth/session in `droppin-eg/app/shopify.server.js` and Prisma session storage.
- Main order-import workflow in `droppin-eg/app/routes/app._index.jsx`.
- Sends package payloads to Droppin backend (API key based) and tracks sent orders.

### Translation microservice (`backend/translation-service/`)
- FastAPI service in `backend/translation-service/app.py`.
- Model: `Helsinki-NLP/opus-mt-en-ar`.
- Endpoint: `POST /translate`, with health endpoint `GET /health`.

## 3. Data Model Mental Model

Core Sequelize models are wired in `backend/models/index.js`.

Important entities:
- `User`: auth identity and role.
- `Shop`: business profile linked 1:1 with User.
- `Driver`: driver profile linked 1:1 with User.
- `Package`: central lifecycle entity.
- `Item`: package line items (1:N with Package).
- `Pickup`: pickup batch scheduling entity.
- `MoneyTransaction`: financial ledger changes.
- `Notification`: in-app notifications.
- Join table: `PickupPackages` (Pickup <-> Package many-to-many).

`Package` model lives in `backend/models/package.model.js` and includes:
- identity, routing, contacts, addresses.
- financial fields (`codAmount`, `deliveryCost`, `shownDeliveryCost`, `paymentMethod`, `isPaid`, etc.).
- lifecycle fields (`status`, `statusHistory`, `actualPickupTime`, `actualDeliveryTime`).
- reverse logistics fields (`returnDetails`, `exchangeDetails`, `deliveredItems`, `rejectionShippingPaidAmount`, `rejectionDeductShipping`).
- Shopify linkage (`shopifyOrderId`, `shopifyOrderName`).

## 4. Package Lifecycle States (Critical)

Package statuses are not simple; they include forward flow + reverse flow + exchange flow.

Common forward flow:
- `awaiting_schedule` -> `scheduled_for_pickup`/`pending` -> `assigned` -> `pickedup` -> `in-transit` -> `delivered`.

Return/cancel/reject-related states include:
- `delivered-awaiting-return`, `delivered-returned`
- `cancelled`, `cancelled-awaiting-return`, `cancelled-returned`
- `rejected`, `rejected-awaiting-return`, `rejected-returned`
- `return-requested`, `return-in-transit`, `return-pending`, `return-completed`

Exchange states include:
- `exchange-awaiting-schedule`, `exchange-awaiting-pickup`, `exchange-in-process`, `exchange-in-transit`, `exchange-awaiting-return`, `exchange-returned`, `exchange-cancelled`

When editing any status logic, inspect both:
- backend status transition handlers (`backend/controllers/package.controller.js`, `backend/controllers/admin.controller.js`)
- admin/shop UI tab filtering logic (especially package tabs and subtabs).

## 5. Primary Business Workflows

### A) Shop creates packages
- API route: `POST /api/packages` in `backend/routes/package.routes.js`.
- Controller: `backend/controllers/package.controller.js::createPackage`.
- Includes items, COD calculations, shown delivery fee, schedule fields.
- Recent guardrails include shown fee <= shop shipping fee constraints.

### B) Bulk import (shop)
- Routes:
  - `POST /api/packages/bulk/import/preview`
  - `POST /api/packages/bulk/import/confirm`
- Parses Excel rows, groups by package reference, validates row-level errors.

### C) Admin assignment and lifecycle operations
- Assign driver endpoint: `POST /api/admin/packages/:packageId/assign-driver`.
- Admin package list endpoint: `GET /api/admin/packages` (supports `statusIn`, paging, sorting).
- Admin dashboard is heavily modularized via factories in:
  - `frontend/src/pages/Admin/dashboard/utils/*.js`
- Modal rendering and popup flows are coordinated through `DashboardModalCluster` and related action factories.

### D) Driver operations
- Driver dashboard handles pickup scanning, status progression, delivery completion, note/photo/signature actions.
- Backend package status updates route: `PATCH /api/packages/:id/status`.

### E) Shopify import and fulfillment bridge
- Shopify app reads orders and sends package payloads to backend.
- Backend has Shopify package route: `POST /api/packages/shopify` (API key auth).
- Fulfillment integration documented in `docs/SHOPIFY_FULFILLMENT.md`.
- Delivery completion can trigger Shopify fulfillment via backend->Shopify app handoff.

## 6. Admin Dashboard Implementation Notes

Admin dashboard (`frontend/src/pages/Admin/Dashboard.js`) is a container with many extracted factories:
- query and tab actions (`packageQueries`, `packageTabActions`)
- status/actions/dialog orchestration (`packageStatusActions`, `packageDialogActions`)
- assignment and pickups (`driverAssignmentActions`, `pickupActions`)
- finance and approvals (`financeActions`, `approvalActions`)
- details/editing (`detailsActions`, `packageEditorActions`, `entityDetailsHandlers`)

Pattern used by current codebase:
- Keep factory invocation after dependent state declarations.
- Pass state setters into factories for centralized side effects.
- Most package filtering in admin is server-side; frontend receives paged data and renders.

## 7. API and Security Conventions

- JWT is mandatory for protected app routes.
- API key can represent shop context for external integration flows.
- `combinedAuth` allows one endpoint to support JWT and shop API key clients.
- Role checks are explicit in route-level middleware (`authorize('admin')`, etc.).

When creating new route behavior:
- preserve role boundaries.
- avoid exposing admin-only actions to API-key-only paths unless intentional.

## 8. Date/Time Conventions

- Backend has Cairo timezone utility in `backend/utils/dateUtils.js`.
- Frontend uses mixed native formatting and helper formatting.
- Current policy expectation in this workspace is date-first format (`dd/mm/yyyy`) for user-facing dates.
- Be careful with serialized string dates already formatted by backend (especially schedule/payment fields).

## 9. Financial Logic Hotspots

High-risk files:
- `backend/controllers/package.controller.js`
- `backend/controllers/admin.controller.js`
- `backend/utils/moneyLogger.js`

Watch for side effects on:
- `Shop.ToCollect`, `Shop.TotalCollected`, settlement operations.
- Driver cash adjustments on return/exchange transitions.
- `isPaid`, `paidAmount`, `rejectionShippingPaidAmount`, and COD recomputations.

## 10. Operations, Scripts, and Deployment

### Backend scripts (`backend/package.json`)
- `npm run dev` -> nodemon server.
- `npm run migrate` -> run migrations.
- `npm run migrate:data` -> sqlite to mysql migration script.
- `npm run generate:bulk-template` -> excel template generation.

### Frontend scripts
- standard CRA scripts (`start`, `build`, `test`).

### Shopify app scripts (`droppin-eg/package.json`)
- `npm run dev` (Shopify CLI).
- `npm run deploy`, `npm run build`, `npm run start`.
- Prisma `setup` in deployment flow.

### Ops docs
- `docs/MAINTENANCE_MODE.md` for Nginx maintenance fallback.
- `docs/nginx-maintenance.conf.example` for maintenance config snippet.
- `droppin-eg/DEPLOYMENT_GUIDE.md` for custom-domain Shopify deployment.

## 11. Frontend Styling and UX Conventions

- Mostly global CSS files, not CSS modules.
- Significant styling in:
  - `frontend/src/App.css`
  - `frontend/src/pages/Admin/AdminDashboard.css`
  - `frontend/src/pages/Shop/ShopDashboard.css`
- Mixture of custom CSS + Bootstrap classes + selective Ant Design usage in admin analytics surfaces.

## 12. Integration-Specific Facts Worth Remembering

- Shopify order IDs from Shopify app are GraphQL GIDs (for example `gid://shopify/Order/...`).
- Backend package status transitions are the primary hook point for fulfillment side effects.
- Shop profile supports `shopifyDomain` and related integration fields.
- Fulfillment payload keys should remain camelCase according to Shopify GraphQL expectations.

## 13. Where to Make Common Changes

- Add/adjust package status logic: `backend/controllers/package.controller.js` and admin/shop tab filters.
- Add admin package tab behaviors: `frontend/src/pages/Admin/dashboard/tabs/*` + `utils/packageQueries.js`.
- Add popup fields in admin package details:
  - desktop: `modals/PackageDesktopDetailsSection.jsx`
  - mobile: `modals/PackageMobileDetailsSection.jsx`
  - open/fetch logic: `utils/entityDetailsHandlers.js`
- Add shop package behavior: `frontend/src/pages/Shop/ShopPackages.js`.
- Add Shopify handoff behavior: `droppin-eg/app/routes/app._index.jsx` and backend `/packages/shopify` route.

## 14. Testing / Verification Checklist for Agents

After changing lifecycle or financial code:
1. Verify role permissions still block unauthorized access.
2. Verify package status transitions on both API and UI.
3. Verify admin tab/subtab filtering still matches statuses.
4. Verify popup details reflect latest state immediately after mutations.
5. Verify money side effects (`ToCollect`, `TotalCollected`, driver cash, payment flags).
6. Verify Shopify-linked packages still carry `shopifyOrderId` and do not break fulfillment handoff.

After changing date formatting:
1. Check admin tables, shop tables, pickup modals, tracking pages, and notes timestamps.
2. Ensure date-only fields and date-time fields both render consistently with product requirement.

## 15. Practical Caveats

- Repository can be in a dirty git state; avoid reverting unrelated changes.
- Some legacy code paths still duplicate fetch/update logic across multiple factories.
- Status strings are used in many places; typo safety is low (stringly-typed system).
- Several UI actions are optimistic then refetched; state drift can happen if one side is updated without the other.

---
If you are a future agent, start by reading:
1. `backend/models/package.model.js`
2. `backend/controllers/package.controller.js`
3. `frontend/src/pages/Admin/Dashboard.js`
4. `frontend/src/pages/Admin/dashboard/utils/packageQueries.js`
5. `frontend/src/pages/Shop/ShopPackages.js`
6. `droppin-eg/app/routes/app._index.jsx`

These files provide the fastest path to understanding the system's real behavior.
