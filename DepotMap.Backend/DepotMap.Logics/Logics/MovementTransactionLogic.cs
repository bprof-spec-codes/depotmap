using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Transaction.Movement;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class MovementTransactionLogic : IMovementTransactionLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MovementTransactionLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<MovementTransactionViewDto>> GetAllAsync()
        {
            var transactions = await _context.Transactions
                .AsNoTracking()
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .Where(t => t.Type == "Transfer")
                .OrderByDescending(t => t.Timestamp)
                .ToListAsync();

            return _mapper.Map<List<MovementTransactionViewDto>>(transactions);
        }

        public async Task<List<MovementTransactionTableRowDto>> GetTableRowsAsync(int skip = 0, int take = 500)
        {
            if (skip < 0)
            {
                skip = 0;
            }

            if (take <= 0)
            {
                take = 500;
            }

            return await _context.Transactions
                .AsNoTracking()
                .Where(t => t.Type == "Transfer")
                .OrderByDescending(t => t.Timestamp)
                .SelectMany(t => t.Items.Select(item => new MovementTransactionTableRowDto
                {
                    TransactionId = t.Id,
                    Status = t.Status,
                    CreatedByUserId = t.CreatedByUserId,
                    Timestamp = t.Timestamp,
                    ProductId = item.Product.SKU ?? item.ProductId,
                    Quantity = item.Quantity,
                    FromCompartmentId = item.FromCompartmentId ?? string.Empty,
                    ToCompartmentId = item.ToCompartmentId ?? string.Empty
                }))
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<MovementTransactionViewDto?> GetByIdAsync(string id)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Transfer");

            if (transaction == null)
            {
                return null;
            }

            return _mapper.Map<MovementTransactionViewDto>(transaction);
        }

        public async Task<MovementTransactionViewDto> CreateAsync(CreateMovementTransactionDto dto)
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

            if (dto.Items == null || !dto.Items.Any())
            {
                throw new InvalidOperationException("Mozgatás nem hozható létre tétel nélkül.");
            }

            await ValidateItemsAsync(dto.Items);

            var transaction = _mapper.Map<Transaction>(dto);
            transaction.Items = _mapper.Map<List<TransactionItem>>(dto.Items);

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            await _context.Entry(transaction).Reference(t => t.CreatedBy).LoadAsync();

            return _mapper.Map<MovementTransactionViewDto>(transaction);
        }

        public async Task<MovementTransactionViewDto?> UpdateAsync(string id, UpdateMovementTransactionDto dto)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Transfer");

            if (transaction == null)
            {
                return null;
            }

            if (transaction.Status == "Closed")
            {
                throw new InvalidOperationException("Lezárt mozgatás nem szerkeszthető.");
            }

            if (dto.Items == null && string.IsNullOrWhiteSpace(dto.Status))
            {
                throw new InvalidOperationException("Az update kérésben legalább az Items vagy a Status mezőt meg kell adni.");
            }

            if (dto.Items != null)
            {
                if (!dto.Items.Any())
                {
                    throw new InvalidOperationException("A tétellista nem lehet üres.");
                }

                await ValidateItemsAsync(dto.Items);

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
                    if (newStatus == "Closed")
                    {
                        if (!transaction.Items.Any())
                        {
                            throw new InvalidOperationException("Üres mozgatás nem zárható le.");
                        }

                        await ApplyTransferAsync(transaction);
                    }

                    transaction.Status = newStatus;
                }
            }

            await _context.SaveChangesAsync();

            return _mapper.Map<MovementTransactionViewDto>(transaction);
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Transfer");

            if (transaction == null)
            {
                return false;
            }

            if (string.Equals(transaction.Status, "Closed", StringComparison.OrdinalIgnoreCase)
                || string.Equals(transaction.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Összekészítés alatt vagy lezárt mozgatás nem törölhető.");
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return true;
        }

        private async Task ValidateItemsAsync(IEnumerable<CreateMovementTransactionItemDto> items)
        {
            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.ProductId))
                {
                    throw new InvalidOperationException("A ProductId kötelező.");
                }

                if (string.IsNullOrWhiteSpace(item.FromCompartmentId))
                {
                    throw new InvalidOperationException("A FromCompartmentId kötelező.");
                }

                if (string.IsNullOrWhiteSpace(item.ToCompartmentId))
                {
                    throw new InvalidOperationException("A ToCompartmentId kötelező.");
                }

                if (item.Quantity <= 0)
                {
                    throw new InvalidOperationException("A mennyiségnek pozitívnak kell lennie.");
                }

                if (item.FromCompartmentId == item.ToCompartmentId)
                {
                    throw new InvalidOperationException("A forrás és cél rekesz nem lehet azonos.");
                }

                var productExists = await _context.Products.AnyAsync(p => p.Id == item.ProductId);
                if (!productExists)
                {
                    throw new InvalidOperationException("A megadott termék nem létezik.");
                }

                var fromCompartmentExists = await _context.Compartments.AnyAsync(c => c.Id == item.FromCompartmentId);
                if (!fromCompartmentExists)
                {
                    throw new InvalidOperationException("A megadott forrás rekesz nem létezik.");
                }

                var toCompartmentExists = await _context.Compartments.AnyAsync(c => c.Id == item.ToCompartmentId);
                if (!toCompartmentExists)
                {
                    throw new InvalidOperationException("A megadott cél rekesz nem létezik.");
                }
            }
        }

        private async Task ApplyTransferAsync(Transaction transaction)
        {
            foreach (var item in transaction.Items)
            {
                var fromStock = await _context.ProductStocks
                    .FirstOrDefaultAsync(ps => ps.CompartmentId == item.FromCompartmentId && ps.ProductId == item.ProductId);

                if (fromStock == null || fromStock.Quantity < item.Quantity)
                {
                    throw new InvalidOperationException($"Nincs elegendő készlet a(z) {item.ProductId} termékből a forrás rekeszben.");
                }
            }

            foreach (var item in transaction.Items)
            {
                var fromStock = await _context.ProductStocks
                    .FirstAsync(ps => ps.CompartmentId == item.FromCompartmentId && ps.ProductId == item.ProductId);

                fromStock.Quantity -= item.Quantity;

                if (fromStock.Quantity == 0)
                {
                    _context.ProductStocks.Remove(fromStock);
                }

                var toStock = await _context.ProductStocks
                    .FirstOrDefaultAsync(ps => ps.CompartmentId == item.ToCompartmentId && ps.ProductId == item.ProductId);

                if (toStock == null)
                {
                    toStock = new ProductStock
                    {
                        Id = Guid.NewGuid().ToString(),
                        ProductId = item.ProductId,
                        CompartmentId = item.ToCompartmentId!,
                        Quantity = 0
                    };

                    _context.ProductStocks.Add(toStock);
                }

                toStock.Quantity += item.Quantity;

                _context.StockMovements.Add(new StockMovement
                {
                    Id = Guid.NewGuid().ToString(),
                    ProductId = item.ProductId,
                    CompartmentId = item.FromCompartmentId!,
                    QuantityChange = -item.Quantity,
                    MovementType = "TransferOut",
                    TransactionId = transaction.Id,
                    CreatedByUserId = transaction.CreatedByUserId,
                    Timestamp = DateTime.UtcNow
                });

                _context.StockMovements.Add(new StockMovement
                {
                    Id = Guid.NewGuid().ToString(),
                    ProductId = item.ProductId,
                    CompartmentId = item.ToCompartmentId!,
                    QuantityChange = item.Quantity,
                    MovementType = "TransferIn",
                    TransactionId = transaction.Id,
                    CreatedByUserId = transaction.CreatedByUserId,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
