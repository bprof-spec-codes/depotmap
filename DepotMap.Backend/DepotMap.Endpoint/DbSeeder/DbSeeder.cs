using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DepotMap.Endpoint.DbSeeder
{
    public class DbSeeder
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<User> _hasher;
        private readonly IConfiguration _config;
        private readonly IWarehouseLogic _warehouseLogic;
        private readonly IWarehouseCellLogic _cellLogic;
        private readonly IShelfLogic _shelfLogic;

        public DbSeeder(
            AppDbContext db,
            IPasswordHasher<User> hasher,
            IConfiguration config,
            IWarehouseLogic warehouseLogic,
            IWarehouseCellLogic cellLogic,
            IShelfLogic shelfLogic)
        {
            _db = db;
            _hasher = hasher;
            _config = config;
            _warehouseLogic = warehouseLogic;
            _cellLogic = cellLogic;
            _shelfLogic = shelfLogic;
        }

        public async Task SeedAsync()
        {
            if (!_db.Products.Any(p => p.Id == "PROD-1"))
            {
                _db.Products.AddRange(
                    new Product { Id = "PROD-1", Name = "Teszt Egér", SKU = "MOUSE-001" },
                    new Product { Id = "PROD-2", Name = "Teszt Billentyűzet", SKU = "KEYB-001" }
                );
                await _db.SaveChangesAsync();
            }

            string? comp1Id = null;
            string? comp2Id = null;

            if (!await _db.Warehouses.AnyAsync(w => w.Name == "Fő Raktár"))
            {
                var warehouse = await _warehouseLogic.CreateAsync(new CreateWarehouseDto
                {
                    Name = "Fő Raktár",
                    GridWidth = 10,
                    GridHeight = 10
                });

                var cells = await _cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
                var targetCell = cells.First(c => c.X == 0 && c.Y == 0);
                await _cellLogic.UpdateCellTypeAsync(targetCell.Id, new UpdateCellTypeDto { CellType = "shelf_area" });

                var shelf = await _shelfLogic.CreateShelfAsync(targetCell.Id, new CreateShelfDto
                {
                    X = 0,
                    Y = 0,
                    Levels = 3,
                    AccessibleFromBothSides = true
                });

                var detail1 = await _shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);
                var detail2 = await _shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);

                var ordered = detail2!.Compartments.OrderBy(c => c.SlotIndex).ToList();
                comp1Id = ordered[0].Id;
                comp2Id = ordered[1].Id;
            }
            else
            {
                var existing = await _db.Compartments
                    .Where(c => c.Shelf.WarehouseCell.Warehouse.Name == "Fő Raktár")
                    .OrderBy(c => c.LevelIndex).ThenBy(c => c.SlotIndex)
                    .Take(2)
                    .Select(c => c.Id)
                    .ToListAsync();
                if (existing.Count >= 2) { comp1Id = existing[0]; comp2Id = existing[1]; }
            }

            if (!_db.Users.Any(u => u.Id == "seed-admin-001"))
            {
                var adminUser = new User
                {
                    Id = "seed-admin-001",
                    Identifier = _config["SeedAdmin:Identifier"]!,
                    FirstName = _config["SeedAdmin:FirstName"]!,
                    LastName = _config["SeedAdmin:LastName"]!,
                    Role = "Manager",
                    Position = _config["SeedAdmin:Position"]!,
                    PasswordHash = ""
                };
                adminUser.PasswordHash = _hasher.HashPassword(adminUser, _config["SeedAdmin:Password"]!);
                _db.Users.Add(adminUser);
                await _db.SaveChangesAsync();
            }

            if (!_db.Users.Any(u => u.Id == "USER-1"))
            {
                var user1 = new User
                {
                    Id = "USER-1",
                    Identifier = "tesztadmin",
                    FirstName = "Teszt",
                    LastName = "Elek",
                    Role = "Manager",
                    Position = "Teszt",
                    PasswordHash = ""
                };
                user1.PasswordHash = _hasher.HashPassword(user1, "Admin123!");
                _db.Users.Add(user1);
                await _db.SaveChangesAsync();
            }

            if (comp1Id != null && comp2Id != null && !_db.ProductStocks.Any(ps => ps.Id == "STOCK-1"))
            {
                _db.ProductStocks.AddRange(
                    new ProductStock { Id = "STOCK-1", ProductId = "PROD-1", CompartmentId = comp1Id, Quantity = 50 },
                    new ProductStock { Id = "STOCK-2", ProductId = "PROD-2", CompartmentId = comp2Id, Quantity = 30 }
                );
                await _db.SaveChangesAsync();
            }

            if (comp1Id != null && comp2Id != null && !_db.Transactions.Any(t => t.Id == "TRANS-IN-1"))
            {
                var inboundTrans = new Transaction
                {
                    Id = "TRANS-IN-1",
                    Type = "Inbound",
                    Status = "Closed",
                    CreatedByUserId = "USER-1",
                    Timestamp = DateTime.UtcNow.AddDays(-1)
                };

                var outboundTrans = new Transaction
                {
                    Id = "TRANS-OUT-1",
                    Type = "Outbound",
                    Status = "Planning",
                    CreatedByUserId = "USER-1",
                    Timestamp = DateTime.UtcNow
                };

                _db.Transactions.AddRange(inboundTrans, outboundTrans);
                await _db.SaveChangesAsync();

                _db.TransactionItems.AddRange(
                    new TransactionItem { Id = "TI-IN-1", TransactionId = "TRANS-IN-1", ProductId = "PROD-1", Quantity = 50, ToCompartmentId = comp1Id, Type = "Inbound" },
                    new TransactionItem { Id = "TI-IN-2", TransactionId = "TRANS-IN-1", ProductId = "PROD-2", Quantity = 30, ToCompartmentId = comp2Id, Type = "Inbound" },
                    new TransactionItem { Id = "TI-OUT-1", TransactionId = "TRANS-OUT-1", ProductId = "PROD-1", Quantity = 5, FromCompartmentId = comp1Id, Type = "Outbound" },
                    new TransactionItem { Id = "TI-OUT-2", TransactionId = "TRANS-OUT-1", ProductId = "PROD-2", Quantity = 2, FromCompartmentId = comp2Id, Type = "Outbound" }
                );
                await _db.SaveChangesAsync();
            }

            if (comp1Id != null && comp2Id != null && !_db.StockMovements.Any(sm => sm.Id == "SM-1"))
            {
                _db.StockMovements.AddRange(
                    new StockMovement
                    {
                        Id = "SM-1",
                        ProductId = "PROD-1",
                        CompartmentId = comp1Id,
                        QuantityChange = 50,
                        MovementType = "Inbound",
                        TransactionId = "TRANS-IN-1",
                        CreatedByUserId = "USER-1",
                        Timestamp = DateTime.UtcNow.AddDays(-1)
                    },
                    new StockMovement
                    {
                        Id = "SM-2",
                        ProductId = "PROD-2",
                        CompartmentId = comp2Id,
                        QuantityChange = 30,
                        MovementType = "Inbound",
                        TransactionId = "TRANS-IN-1",
                        CreatedByUserId = "USER-1",
                        Timestamp = DateTime.UtcNow.AddDays(-1)
                    }
                );
                await _db.SaveChangesAsync();
            }
        }
    }
}
