# Folder Structure on Frontend Project
This document describes the basic folder structure of the frontend project.
## .../core/

Things that are instantiated once and affect the entire application go here –
authentication, route protection, HTTP handling.

*For example:*
- `guards/auth` – AuthGuard for protected routes
- `interceptors/jwt` – Automatically attaching the JWT token to every request
- `services/auth` – AuthService and other singleton services
- `models/dtos` – TypeScript interfaces, DTOs

## .../shared/

Reusable components that are used by multiple features.
If something appears in two different places, it goes here.

*For example:*
- `components/` – e.g. navbar, modals, loading spinner

## .../features/

Modules separated by business functionality. Each subfolder is a self-contained
unit that only holds its own things, such as
list components and form/edit components.

*For example:*
- `warehouse/` – warehouse designer, list and edit components
- `inventory/` – inventory overview components