using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DepotMap.Data.DbSeeder
{
    public class DbSeeder
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<User> _hasher;
        private readonly IConfiguration _config;

        public DbSeeder(AppDbContext db, IPasswordHasher<User> hasher, IConfiguration config)
        {
            _db = db;
            _hasher = hasher;
            _config = config;
        }

        public void Seed()
        {
            if (!_db.Products.Any(p => p.Id == "PROD-1"))
            {
                _db.Products.AddRange(
                    new Product { Id = "PROD-1", Name = "Teszt Egér", SKU = "MOUSE-001" },
                    new Product { Id = "PROD-2", Name = "Teszt Billentyűzet", SKU = "KEYB-001" }
                );
                _db.SaveChanges();
            }

            if (!_db.Warehouses.Any(w => w.Id == "WH-1"))
            {
                var warehouse = new Warehouse { Id = "WH-1", Name = "Fő Raktár", GridWidth = 10, GridHeight = 10 };
                _db.Warehouses.Add(warehouse);
                _db.SaveChanges();

                var cell = new WarehouseCell { Id = "CELL-1", WarehouseId = "WH-1", X = 1, Y = 1, CellType = "shelf" };
                _db.WarehouseCells.Add(cell);
                _db.SaveChanges();

                var shelf = new Shelf { Id = "SHELF-1", WarehouseCellId = "CELL-1", Code = "A1" };
                _db.Shelves.Add(shelf);
                _db.SaveChanges();

                _db.Compartments.AddRange(
                    new Compartment { Id = "COMP-1", ShelfId = "SHELF-1", Code = "A1-L1-S1", LevelIndex = 1, SlotIndex = 1 },
                    new Compartment { Id = "COMP-2", ShelfId = "SHELF-1", Code = "A1-L1-S2", LevelIndex = 1, SlotIndex = 2 }
                );
                _db.SaveChanges();
            }

            if (!_db.Users.Any(u => u.Id == "seed-admin-001"))
            {
                var adminUser = new User
                {
                    Id = "seed-admin-001",
                    Identifier = _config["SeedAdmin:Identifier"]!,
                    FirstName = _config["SeedAdmin:FirstName"]!,
                    LastName = _config["SeedAdmin:LastName"]!,
                    Role = "superadmin",
                    Position = _config["SeedAdmin:Position"]!,
                    PasswordHash = ""
                };
                adminUser.PasswordHash = _hasher.HashPassword(adminUser, _config["SeedAdmin:Password"]!);
                _db.Users.Add(adminUser);
                _db.SaveChanges();
            }

            if (!_db.Users.Any(u => u.Id == "USER-1"))
            {
                var user1 = new User
                {
                    Id = "USER-1",
                    Identifier = "tesztadmin",
                    FirstName = "Teszt",
                    LastName = "Elek",
                    Role = "superadmin",
                    Position = "Raktárvezető",
                    PasswordHash = ""
                };
                user1.PasswordHash = _hasher.HashPassword(user1, "Admin123!");
                _db.Users.Add(user1);
                _db.SaveChanges();
            }

            if (!_db.ProductStocks.Any(ps => ps.Id == "STOCK-1"))
            {
                _db.ProductStocks.AddRange(
                    new ProductStock { Id = "STOCK-1", ProductId = "PROD-1", CompartmentId = "COMP-1", Quantity = 50 },
                    new ProductStock { Id = "STOCK-2", ProductId = "PROD-2", CompartmentId = "COMP-2", Quantity = 30 }
                );
                _db.SaveChanges();
            }

            if (!_db.Transactions.Any(t => t.Id == "TRANS-IN-1"))
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
                _db.SaveChanges();

                _db.TransactionItems.AddRange(
                    new TransactionItem { Id = "TI-IN-1", TransactionId = "TRANS-IN-1", ProductId = "PROD-1", Quantity = 50, ToCompartmentId = "COMP-1", Type = "Inbound" },
                    new TransactionItem { Id = "TI-IN-2", TransactionId = "TRANS-IN-1", ProductId = "PROD-2", Quantity = 30, ToCompartmentId = "COMP-2", Type = "Inbound" },
                    new TransactionItem { Id = "TI-OUT-1", TransactionId = "TRANS-OUT-1", ProductId = "PROD-1", Quantity = 5, FromCompartmentId = "COMP-1", Type = "Outbound" },
                    new TransactionItem { Id = "TI-OUT-2", TransactionId = "TRANS-OUT-1", ProductId = "PROD-2", Quantity = 2, FromCompartmentId = "COMP-2", Type = "Outbound" }
                );
                _db.SaveChanges();
            }

            if (!_db.StockMovements.Any(sm => sm.Id == "SM-1"))
            {
                _db.StockMovements.AddRange(
                    new StockMovement
                    {
                        Id = "SM-1",
                        ProductId = "PROD-1",
                        CompartmentId = "COMP-1",
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
                        CompartmentId = "COMP-2",
                        QuantityChange = 30,
                        MovementType = "Inbound",
                        TransactionId = "TRANS-IN-1",
                        CreatedByUserId = "USER-1",
                        Timestamp = DateTime.UtcNow.AddDays(-1)
                    }
                );
                _db.SaveChanges();
            }
        }
    }
}
