using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Transaction.Purchasing;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class PurchasingTransactionLogic : IPurchasingTransactionLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PurchasingTransactionLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<PurchasingTransactionViewDto>> GetAllAsync()
        {
            var transactions = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .Where(t => t.Type == "Inbound")
                .ToListAsync();

            return _mapper.Map<List<PurchasingTransactionViewDto>>(transactions);
        }

        public async Task<List<PurchasingTransactionTableRowDto>> GetTableRowsAsync(
            int skip = 0,
            int take = 500,
            DateTime? date = null,
            string? status = null,
            string? createdByUserId = null,
            string? productId = null,
            string? toCompartmentId = null,
            int? quantity = null)
        {
            if (skip < 0)
            {
                skip = 0;
            }

            if (take <= 0)
            {
                take = 500;
            }

            status = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
            createdByUserId = string.IsNullOrWhiteSpace(createdByUserId) ? null : createdByUserId.Trim();
            productId = string.IsNullOrWhiteSpace(productId) ? null : productId.Trim();
            toCompartmentId = string.IsNullOrWhiteSpace(toCompartmentId) ? null : toCompartmentId.Trim();

            var transactionsQuery = _context.Transactions
                .AsNoTracking()
                .Where(t => t.Type == "Inbound");

            if (date.HasValue)
            {
                var start = date.Value.Date;
                var end = start.AddDays(1);
                transactionsQuery = transactionsQuery.Where(t => t.Timestamp >= start && t.Timestamp < end);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                transactionsQuery = transactionsQuery.Where(t => t.Status.Contains(status));
            }

            if (!string.IsNullOrWhiteSpace(createdByUserId))
            {
                transactionsQuery = transactionsQuery.Where(t => t.CreatedByUserId.Contains(createdByUserId));
            }

            var rowsQuery = transactionsQuery
                .OrderByDescending(t => t.Timestamp)
                .SelectMany(t => t.Items.Select(item => new PurchasingTransactionTableRowDto
                {
                    TransactionId = t.Id,
                    Status = t.Status,
                    CreatedByUserId = t.CreatedByUserId,
                    Timestamp = t.Timestamp,
                    ProductId = item.Product.SKU ?? item.ProductId,
                    ToCompartmentId = item.ToCompartmentId ?? string.Empty,
                    Quantity = item.Quantity
                }));

            if (!string.IsNullOrWhiteSpace(productId))
            {
                rowsQuery = rowsQuery.Where(r => r.ProductId.Contains(productId));
            }

            if (!string.IsNullOrWhiteSpace(toCompartmentId))
            {
                rowsQuery = rowsQuery.Where(r => r.ToCompartmentId.Contains(toCompartmentId));
            }

            if (quantity.HasValue)
            {
                rowsQuery = rowsQuery.Where(r => r.Quantity == quantity.Value);
            }

            return await rowsQuery
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<PurchasingTransactionViewDto?> GetByIdAsync(string id)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Inbound");

            if (transaction == null) 
                return null;

            return _mapper.Map<PurchasingTransactionViewDto>(transaction);
        }

        public async Task<PurchasingTransactionViewDto> CreateAsync(CreatePurchasingTransactionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CreatedByUserId))
            {
                throw new InvalidOperationException("A CreatedByUserId kötelező.");
            }

            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.CreatedByUserId);
            if (!userExists)
            {
                throw new InvalidOperationException("A megadott felhasználó nem létezik.");
            }

            foreach (var item in dto.Items)
            {
                if (string.IsNullOrWhiteSpace(item.ProductId))
                {
                    throw new InvalidOperationException("A ProductId kötelező.");
                }

                if (string.IsNullOrWhiteSpace(item.ToCompartmentId))
                {
                    throw new InvalidOperationException("A ToCompartmentId kötelező.");
                }

                var productExists = await _context.Products.AnyAsync(p => p.Id == item.ProductId);
                if (!productExists)
                {
                    throw new InvalidOperationException("A megadott termék nem létezik.");
                }

                var compartmentExists = await _context.Compartments.AnyAsync(c => c.Id == item.ToCompartmentId);
                if (!compartmentExists)
                {
                    throw new InvalidOperationException("A megadott rekesz nem létezik.");
                }
            }

            var transaction = _mapper.Map<Transaction>(dto);

            if (dto.Items.Any())
            {
                transaction.Items = _mapper.Map<List<TransactionItem>>(dto.Items);
            }

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            await _context.Entry(transaction).Reference(t => t.CreatedBy).LoadAsync();

            return _mapper.Map<PurchasingTransactionViewDto>(transaction);
        }

        public async Task<PurchasingTransactionViewDto?> UpdateAsync(string id, UpdatePurchasingTransactionDto dto)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Inbound");

            if (transaction == null)
            {
                return null;
            }

            if (transaction.Status == "Closed")
            {
                throw new InvalidOperationException("Lezárt beszerzés nem szerkeszthető.");
            }

            if (dto.Items == null && string.IsNullOrWhiteSpace(dto.Status))
            {
                throw new InvalidOperationException("Az update kérésben legalább az Items vagy a Status mezőt meg kell adni.");
            }

            if (dto.Items != null)
            {
                foreach (var item in dto.Items)
                {
                    if (string.IsNullOrWhiteSpace(item.ProductId))
                    {
                        throw new InvalidOperationException("A ProductId kötelező.");
                    }

                    if (string.IsNullOrWhiteSpace(item.ToCompartmentId))
                    {
                        throw new InvalidOperationException("A ToCompartmentId kötelező.");
                    }

                    var productExists = await _context.Products.AnyAsync(p => p.Id == item.ProductId);
                    if (!productExists)
                    {
                        throw new InvalidOperationException("A megadott termék nem létezik.");
                    }

                    var compartmentExists = await _context.Compartments.AnyAsync(c => c.Id == item.ToCompartmentId);
                    if (!compartmentExists)
                    {
                        throw new InvalidOperationException("A megadott rekesz nem létezik.");
                    }
                }

                _context.TransactionItems.RemoveRange(transaction.Items);

                var newItems = _mapper.Map<List<TransactionItem>>(dto.Items);
                transaction.Items = newItems;
            }

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                var currentStatus = transaction.Status;
                var newStatus = dto.Status;

                if (currentStatus != newStatus)
                {
                    if (currentStatus == "Closed")
                    {
                        throw new InvalidOperationException("A lezárt beszerzés státusza többé nem módosítható.");
                    }

                    if (newStatus == "Closed")
                    {
                        if (!transaction.Items.Any())
                        {
                            throw new InvalidOperationException("Üres beszerzés nem zárható le.");
                        }

                        foreach (var item in transaction.Items)
                        {
                            var stock = await _context.ProductStocks
                                .FirstOrDefaultAsync(ps => ps.CompartmentId == item.ToCompartmentId && ps.ProductId == item.ProductId);

                            if (stock == null)
                            {
                                stock = new ProductStock
                                {
                                    Id = Guid.NewGuid().ToString(),
                                    ProductId = item.ProductId,
                                    CompartmentId = item.ToCompartmentId!,
                                    Quantity = 0
                                };

                                _context.ProductStocks.Add(stock);
                            }

                            stock.Quantity += item.Quantity;

                            var movement = new StockMovement
                            {
                                Id = Guid.NewGuid().ToString(),
                                ProductId = item.ProductId,
                                CompartmentId = item.ToCompartmentId!,
                                QuantityChange = item.Quantity,
                                MovementType = "Inbound",
                                TransactionId = transaction.Id,
                                CreatedByUserId = transaction.CreatedByUserId,
                                Timestamp = DateTime.UtcNow
                            };

                            _context.StockMovements.Add(movement);
                        }
                    }

                    transaction.Status = newStatus;
                }
            }
            await _context.SaveChangesAsync();

            return _mapper.Map<PurchasingTransactionViewDto>(transaction);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Inbound");

            if (transaction == null)
            {
                return false;
            }

            if (string.Equals(transaction.Status, "Closed", StringComparison.OrdinalIgnoreCase)
                || string.Equals(transaction.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Összekészítés alatt vagy lezárt beszerzés nem törölhető.");
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}