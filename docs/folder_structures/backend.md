# Backend folder structure

This document describes the folder structure of the backend project.

```
DepotMap.Backend/
 ├── DepotMap.Endpoint/
 ├── DepotMap.Logics/
 ├── DepotMap.Data/
 └── DepotMap.Entities/
```

## DepotMap.Entities

Plain C# model classes. No logic, no dependencies – just the entities.

*For example:*
- `User.cs`
- `Warehouse.cs`
- `ProductDto.cs`

## DepotMap.Data

Database context and migrations.

*For example:*
- `ApplicationDbContext.cs` – DbSet definitions
- `Migrations/` – auto-generated EF Core migrations

## DepotMap.Logics

Business logic and service layer. Interfaces and their implementations go here.

*For example:*
- `IWarehouseLogic.cs` + `WarehouseLogic.cs`

## DepotMap.Endpoint

The ASP.NET Web API layer. Controllers, middleware configuration and app startup.

*For example:*
- `Controllers/` – API controllers
- `Program.cs` – middleware, CORS, Swagger, authentication setup