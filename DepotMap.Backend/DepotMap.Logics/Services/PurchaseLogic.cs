using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class PurchaseLogic : IPurchaseLogic
    {
        private readonly AppDbContext _db;

        public PurchaseLogic(AppDbContext db)
        {
            _db = db;
        }

        public async Task<string> CreatePurchaseAsync(CreatePurchaseDto dto, string createdByUserId)
        {
            // Basic checks
            if (dto == null || dto.Items == null || dto.Items.Count == 0)
                throw new ArgumentException("At least one item is required.");

            if (string.IsNullOrWhiteSpace(createdByUserId))
                throw new ArgumentException("CreatedByUserId is required.");

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                    throw new ArgumentException("Quantity must be greater than zero.");

                if (string.IsNullOrWhiteSpace(item.ProductId))
                    throw new ArgumentException("ProductId is required.");

                if (string.IsNullOrWhiteSpace(item.ToCompartmentId))
                    throw new ArgumentException("ToCompartmentId is required.");
            }

            await using var dbTx = await _db.Database.BeginTransactionAsync();

            try
            {
                // Create transaction header
                var transaction = new Transaction
                {
                    Type = "inbound",
                    Status = "closed",
                    Timestamp = DateTime.UtcNow,
                    CreatedByUserId = createdByUserId
                };

                _db.Set<Transaction>().Add(transaction);

                // Process each item one by one
                foreach (var item in dto.Items)
                {
                    var product = await _db.Set<Product>()
                        .FirstOrDefaultAsync(p => p.Id == item.ProductId);

                    if (product == null)
                        throw new ArgumentException($"Product not found: {item.ProductId}");

                    var compartment = await _db.Set<Compartment>()
                        .FirstOrDefaultAsync(c => c.Id == item.ToCompartmentId);

                    if (compartment == null)
                        throw new ArgumentException($"Compartment not found: {item.ToCompartmentId}");

                    var transactionItem = new TransactionItem
                    {
                        Type = "inbound",
                        Transaction = transaction,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        FromCompartmentId = null,
                        ToCompartmentId = item.ToCompartmentId
                    };

                    _db.Set<TransactionItem>().Add(transactionItem);

                    var stock = await _db.Set<ProductStock>()
                        .FirstOrDefaultAsync(s =>
                            s.ProductId == item.ProductId &&
                            s.CompartmentId == item.ToCompartmentId);

                    if (stock == null)
                    {
                        stock = new ProductStock
                        {
                            ProductId = item.ProductId,
                            CompartmentId = item.ToCompartmentId,
                            Quantity = item.Quantity
                        };

                        _db.Set<ProductStock>().Add(stock);
                    }
                    else
                    {
                        stock.Quantity = stock.Quantity + item.Quantity;
                    }

                    var movement = new StockMovement
                    {
                        ProductId = item.ProductId,
                        CompartmentId = item.ToCompartmentId,
                        QuantityChange = item.Quantity,
                        MovementType = "inbound",
                        Timestamp = DateTime.UtcNow,
                        UserId = createdByUserId
                    };

                    _db.Set<StockMovement>().Add(movement);
                }

                await _db.SaveChangesAsync();
                await dbTx.CommitAsync();

                return transaction.Id;
            }
            catch
            {
                await dbTx.RollbackAsync();
                throw;
            }
        }
    }
}