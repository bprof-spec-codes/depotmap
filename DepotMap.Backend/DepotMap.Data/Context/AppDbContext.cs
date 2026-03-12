using DepotMap.Entities.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

//Beépített Transaction osztály is van, így külön be kell állítani, hogy erre mutasson
using Transaction = DepotMap.Entities.Models.Transaction;

namespace DepotMap.Data.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Warehouse> Warehouses => Set<Warehouse>();
        public DbSet<WarehouseCell> WarehouseCells => Set<WarehouseCell>();
        public DbSet<Shelf> Shelves => Set<Shelf>();
        public DbSet<Compartment> Compartments => Set<Compartment>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<ProductHistory> ProductHistories => Set<ProductHistory>();
        public DbSet<ProductStock> ProductStocks => Set<ProductStock>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<TransactionItem> TransactionItems => Set<TransactionItem>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();
        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Warehouse
            modelBuilder.Entity<Warehouse>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired();
                e.HasMany(x => x.Cells)
                 .WithOne(x => x.Warehouse)
                 .HasForeignKey(x => x.WarehouseId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // WarehouseCell 
            modelBuilder.Entity<WarehouseCell>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.WarehouseId, x.X, x.Y }).IsUnique();
                e.HasMany(x => x.Shelves)
                 .WithOne(x => x.WarehouseCell)
                 .HasForeignKey(x => x.WarehouseCellId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Shelf
            modelBuilder.Entity<Shelf>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.Code).IsUnique();
                e.HasMany(x => x.Compartments)
                 .WithOne(x => x.Shelf)
                 .HasForeignKey(x => x.ShelfId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Compartment 
            modelBuilder.Entity<Compartment>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.Code).IsUnique();
                e.HasIndex(x => new { x.ShelfId, x.LevelIndex, x.SlotIndex }).IsUnique();
            });

            // Product
            modelBuilder.Entity<Product>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.SKU).IsUnique();
            });

            // ProductHistory
            modelBuilder.Entity<ProductHistory>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasOne(x => x.Product)
                 .WithMany(x => x.History)
                 .HasForeignKey(x => x.ProductId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.CreatedBy)
                 .WithMany()
                 .HasForeignKey(x => x.CreatedByUserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ProductStock
            modelBuilder.Entity<ProductStock>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => new { x.ProductId, x.CompartmentId }).IsUnique();
                e.HasOne(x => x.Product)
                 .WithMany(x => x.ProductStocks)
                 .HasForeignKey(x => x.ProductId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Compartment)
                 .WithMany(x => x.ProductStocks)
                 .HasForeignKey(x => x.CompartmentId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Transaction
            modelBuilder.Entity<Transaction>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasOne(x => x.CreatedBy)
                 .WithMany()
                 .HasForeignKey(x => x.CreatedByUserId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasMany(x => x.Items)
                 .WithOne(x => x.Transaction)
                 .HasForeignKey(x => x.TransactionId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // TransactionItem
            modelBuilder.Entity<TransactionItem>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasOne(x => x.Product)
                 .WithMany()
                 .HasForeignKey(x => x.ProductId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.FromCompartment)
                 .WithMany()
                 .HasForeignKey(x => x.FromCompartmentId)
                 .OnDelete(DeleteBehavior.Restrict)
                 .IsRequired(false);
                e.HasOne(x => x.ToCompartment)
                 .WithMany()
                 .HasForeignKey(x => x.ToCompartmentId)
                 .OnDelete(DeleteBehavior.Restrict)
                 .IsRequired(false);
            });

            // StockMovement
            modelBuilder.Entity<StockMovement>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasOne(x => x.Product)
                 .WithMany()
                 .HasForeignKey(x => x.ProductId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Compartment)
                 .WithMany()
                 .HasForeignKey(x => x.CompartmentId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Transaction)
                 .WithMany(x => x.StockMovements)
                 .HasForeignKey(x => x.TransactionId)
                 .OnDelete(DeleteBehavior.Restrict)
                 .IsRequired(false);
                e.HasOne(x => x.CreatedBy)
                 .WithMany()
                 .HasForeignKey(x => x.CreatedByUserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // User
            modelBuilder.Entity<User>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.Identifier).IsUnique();
            });
        }
    }

}
