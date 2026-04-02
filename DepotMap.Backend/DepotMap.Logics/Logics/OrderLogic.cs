using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Transaction.Order;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class OrderLogic: IOrderLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public OrderLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<OrderViewDto>> GetAllOrdersAsync()
        {
            var transactions = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .Where(t => t.Type == "Outbound")
                .ToListAsync();

            return _mapper.Map<List<OrderViewDto>>(transactions);
        }

        public async Task<OrderViewDto?> GetOrderByIdAsync(string id)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Outbound");

            if (transaction == null) return null;

            return _mapper.Map<OrderViewDto>(transaction);
        }

        public async Task<OrderViewDto?> CreateOrderAsync(CreateOrderDto dto)
        {
            var order = _mapper.Map<Transaction>(dto);

            if (dto.Items != null && dto.Items.Any())
            {
                foreach (var itemDto in dto.Items)
                {
                    var stock = await _context.ProductStocks
                        .FirstOrDefaultAsync(ps => ps.CompartmentId == itemDto.FromCompartmentId && ps.ProductId == itemDto.ProductId);

                    if (stock == null)
                    {
                        throw new InvalidOperationException($"A megadott termék ({itemDto.ProductId}) nem található a kiválasztott rekeszben ({itemDto.FromCompartmentId})!");
                    }

                    if (stock.Quantity < itemDto.Quantity)
                    {
                        throw new InvalidOperationException($"Nincs elég készlet a(z) {itemDto.ProductId} termékből! Elérhető: {stock.Quantity} db, kért mennyiség: {itemDto.Quantity} db.");
                    }
                }
            }

            _context.Transactions.Add(order);
            await _context.SaveChangesAsync();

            await _context.Entry(order).Reference(t => t.CreatedBy).LoadAsync();

            return _mapper.Map<OrderViewDto>(order);
        }

        public async Task<OrderViewDto?> UpdateOrderAsync(string id, UpdateOrderDto dto)
        {
            var order = await _context.Transactions
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Outbound");

            if (order == null) return null;

            if (order.Status == "Closed")
            {
                throw new InvalidOperationException("Lezárt rendelés tételei már nem módosíthatók!");
            }

            if (dto.Items != null && dto.Items.Any())
            {
                foreach (var itemDto in dto.Items)
                {
                    var stock = await _context.ProductStocks
                        .FirstOrDefaultAsync(ps => ps.CompartmentId == itemDto.FromCompartmentId && ps.ProductId == itemDto.ProductId);

                    if (stock == null)
                    {
                        throw new InvalidOperationException($"A megadott termék ({itemDto.ProductId}) nem található a kiválasztott rekeszben ({itemDto.FromCompartmentId})!");
                    }

                    if (stock.Quantity < itemDto.Quantity)
                    {
                        throw new InvalidOperationException($"Nincs elég készlet a(z) {itemDto.ProductId} termékből! Elérhető: {stock.Quantity} db, kért mennyiség: {itemDto.Quantity} db.");
                    }
                }
            }

            _context.TransactionItems.RemoveRange(order.Items);

            var newItems = _mapper.Map<List<TransactionItem>>(dto.Items);

            order.Items = newItems;

            await _context.SaveChangesAsync();

            await _context.Entry(order).Reference(t => t.CreatedBy).LoadAsync();
            return _mapper.Map<OrderViewDto>(order);
        }

        public async Task<OrderViewDto?> UpdateOrderStatusAsync(string id, UpdateOrderStatusDto dto)
        {
            var order = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Outbound");

            if (order == null) return null;

            var currentStatus = order.Status;
            var newStatus = dto.Status;

            if (currentStatus == newStatus) return _mapper.Map<OrderViewDto>(order);

            if (currentStatus == "Planning" && newStatus != "Processing")
            {
                throw new InvalidOperationException("Egy 'Planning' (Tervezés) állapotú rendelést először 'Processing' (Összekészítés) állapotba kell léptetni!");
            }

            if (currentStatus == "Processing" && newStatus != "Closed")
            {
                throw new InvalidOperationException("Egy 'Processing' (Összekészítés) állapotú rendelést csak 'Closed' (Lezárva) állapotba lehet tenni!");
            }

            if (currentStatus == "Closed")
            {
                throw new InvalidOperationException("Egy már lezárt ('Closed') rendelés állapota utólag nem módosítható!");
            }

            if ((newStatus == "Processing" || newStatus == "Closed") && !order.Items.Any())
            {
                throw new InvalidOperationException("Egy rendelést nem lehet elindítani vagy lezárni úgy, hogy nincsenek benne tételek!");
            }

            if (newStatus == "Closed")
            {
                foreach (var item in order.Items)
                {
                    var stock = await _context.ProductStocks
                        .FirstOrDefaultAsync(ps => ps.CompartmentId == item.FromCompartmentId && ps.ProductId == item.ProductId);

                    if (stock == null || stock.Quantity < item.Quantity)
                    {
                        throw new InvalidOperationException($"Nincs elegendő készlet a(z) {item.ProductId} azonosítójú termékből a kiválasztott rekeszben! A lezárás megszakítva.");
                    }

                    stock.Quantity -= item.Quantity;

                    if (stock.Quantity == 0)
                    {
                        _context.ProductStocks.Remove(stock);
                    }

                    var movement = new StockMovement
                    {
                        Id = Guid.NewGuid().ToString(),
                        ProductId = item.ProductId,
                        CompartmentId = item.FromCompartmentId,
                        QuantityChange = -item.Quantity, 
                        MovementType = "Outbound",
                        TransactionId = order.Id,
                        CreatedByUserId = order.CreatedByUserId,
                        Timestamp = DateTime.UtcNow
                    };

                    _context.StockMovements.Add(movement);
                }
            }

            order.Status = newStatus;

            await _context.SaveChangesAsync();

            return _mapper.Map<OrderViewDto>(order);
        }

        public async Task<bool> DeleteOrderAsync(string id)
        {
            var order = await _context.Transactions.FindAsync(id);

            if (order == null || order.Type != "Outbound")
                return false;

            if (order.Status != "Planning")
            {
                throw new InvalidOperationException("Szigorúan tilos törölni egy olyan rendelést, ami már feldolgozás alatt van vagy le lett zárva. Csak 'Planning' állapotú rendelések törölhetők!");
            }

            _context.Transactions.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
