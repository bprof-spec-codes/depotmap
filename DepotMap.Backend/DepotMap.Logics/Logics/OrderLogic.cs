using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.StockMovement;
using DepotMap.Entities.Models.DTOs.Transaction.Order;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;
using DepotMap.Logics.Helpers;

namespace DepotMap.Logics.Logics
{
    public class OrderLogic: IOrderLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IStockMovementLogic _stockMovementLogic;

        public OrderLogic(AppDbContext context, IMapper mapper, IStockMovementLogic stockMovementLogic)
        {
            _context = context;
            _mapper = mapper;
            _stockMovementLogic = stockMovementLogic;
        }

        public async Task<List<OrderViewDto>> GetAllOrdersAsync()
        {
            var transactions = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .Include(t => t.Items).ThenInclude(i => i.Product) 
                .Include(t => t.Items).ThenInclude(i => i.FromCompartment)
                .Where(t => t.Type == "Outbound")
                .ToListAsync();

            return _mapper.Map<List<OrderViewDto>>(transactions);
        }

        public async Task<OrderViewDto?> GetOrderByIdAsync(string id)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.Items).ThenInclude(i => i.Product)
                .Include(t => t.Items).ThenInclude(i => i.FromCompartment)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Outbound");

            if (transaction == null) return null;

            return _mapper.Map<OrderViewDto>(transaction);
        }

        public async Task<OrderViewDto?> CreateOrderAsync(CreateOrderDto dto)
        {
            var order = _mapper.Map<Transaction>(dto);

            var newItems = new List<TransactionItem>();

            if (dto.Items != null && dto.Items.Any())
            {
                var duplicate = dto.Items
                    .GroupBy(i => new { SKU = i.ProductSKU, Compartment = i.FromCompartmentCode ?? "" })
                    .FirstOrDefault(g => g.Count() > 1);

                if (duplicate != null)
                {
                    throw new BadRequestException($"Nem adhatod hozzá a(z) {duplicate.Key.SKU} terméket ugyanabból a rekeszből ({duplicate.Key.Compartment}) többször! Kérlek, vond össze a darabszámokat egyetlen tételbe!");
                }

                foreach (var itemDto in dto.Items)
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.SKU == itemDto.ProductSKU);
                    if (product == null)
                        throw new NotFoundException($"Nem található termék a következő cikkszámmal: {itemDto.ProductSKU}");

                    string? compartmentId = null;
                    if (!string.IsNullOrWhiteSpace(itemDto.FromCompartmentCode))
                    {
                        var comp = await _context.Compartments.FirstOrDefaultAsync(c => c.Code == itemDto.FromCompartmentCode);
                        if (comp == null)
                            throw new NotFoundException($"Nem található rekesz a következő kóddal: {itemDto.FromCompartmentCode}");
                        compartmentId = comp.Id;
                    }

                    var stock = await _context.ProductStocks
                        .FirstOrDefaultAsync(ps => ps.CompartmentId == compartmentId && ps.ProductId == product.Id);

                    if (stock == null)
                    {
                        throw new NotFoundException($"A megadott termék ({itemDto.ProductSKU}) nem található a kiválasztott rekeszben ({itemDto.FromCompartmentCode ?? "Nincs megadva"})!");
                    }

                    if (stock.Quantity < itemDto.Quantity)
                    {
                        throw new BadRequestException($"Nincs elég készlet a(z) {itemDto.ProductSKU} termékből! Elérhető: {stock.Quantity} db, kért mennyiség: {itemDto.Quantity} db.");
                    }

                    newItems.Add(new TransactionItem
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = "Outbound",
                        ProductId = product.Id,
                        FromCompartmentId = compartmentId,
                        Quantity = itemDto.Quantity
                    });
                }
            }

            order.Items = newItems;

            _context.Transactions.Add(order);
            await _context.SaveChangesAsync();

            await _context.Entry(order).Reference(t => t.CreatedBy).LoadAsync();
            foreach (var item in order.Items)
            {
                await _context.Entry(item).Reference(i => i.Product).LoadAsync();
                if (item.FromCompartmentId != null)
                    await _context.Entry(item).Reference(i => i.FromCompartment).LoadAsync();
            }

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
                throw new BadRequestException("Lezárt rendelés tételei már nem módosíthatók!");
            }

            var newItems = new List<TransactionItem>();

            if (dto.Items != null && dto.Items.Any())
            {
                var duplicate = dto.Items
                    .GroupBy(i => new { SKU = i.ProductSKU, Compartment = i.FromCompartmentCode ?? "" })
                    .FirstOrDefault(g => g.Count() > 1);

                if (duplicate != null)
                {
                    throw new BadRequestException($"Nem adhatod hozzá a(z) {duplicate.Key.SKU} terméket ugyanabból a rekeszből ({duplicate.Key.Compartment}) többször! Kérlek, vond össze a darabszámokat egyetlen tételbe!");
                }

                foreach (var itemDto in dto.Items)
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.SKU == itemDto.ProductSKU);
                    if (product == null)
                        throw new NotFoundException($"Nem található termék a következő cikkszámmal: {itemDto.ProductSKU}");

                    string? compartmentId = null;
                    if (!string.IsNullOrWhiteSpace(itemDto.FromCompartmentCode))
                    {
                        var comp = await _context.Compartments.FirstOrDefaultAsync(c => c.Code == itemDto.FromCompartmentCode);
                        if (comp == null)
                            throw new NotFoundException($"Nem található rekesz a következő kóddal: {itemDto.FromCompartmentCode}");
                        compartmentId = comp.Id;
                    }

                    var stock = await _context.ProductStocks
                        .FirstOrDefaultAsync(ps => ps.CompartmentId == compartmentId && ps.ProductId == product.Id);

                    if (stock == null)
                    {
                        throw new NotFoundException($"A megadott termék ({itemDto.ProductSKU}) nem található a kiválasztott rekeszben ({itemDto.FromCompartmentCode ?? "Nincs megadva"})!");
                    }

                    if (stock.Quantity < itemDto.Quantity)
                    {
                        throw new BadRequestException($"Nincs elég készlet a(z) {itemDto.ProductSKU} termékből! Elérhető: {stock.Quantity} db, kért mennyiség: {itemDto.Quantity} db.");
                    }

                    newItems.Add(new TransactionItem
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = "Outbound",
                        ProductId = product.Id,
                        FromCompartmentId = compartmentId,
                        Quantity = itemDto.Quantity
                    });
                }
            }

            _context.TransactionItems.RemoveRange(order.Items);
            order.Items = newItems;

            await _context.SaveChangesAsync();

            await _context.Entry(order).Reference(t => t.CreatedBy).LoadAsync();
            foreach (var item in order.Items)
            {
                await _context.Entry(item).Reference(i => i.Product).LoadAsync();
                if (item.FromCompartmentId != null)
                    await _context.Entry(item).Reference(i => i.FromCompartment).LoadAsync();
            }

            return _mapper.Map<OrderViewDto>(order);
        }

        public async Task<OrderViewDto?> UpdateOrderStatusAsync(string id, UpdateOrderStatusDto dto, string userRole)
        {
            var order = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Outbound");

            if (order == null) return null;

            var currentStatus = order.Status;
            var newStatus = dto.Status;

            if (currentStatus == newStatus) return _mapper.Map<OrderViewDto>(order);

            if (userRole == "Operator")
            {
                if (!(currentStatus == "Processing" && newStatus == "Closed"))
                {
                    throw new ForbiddenException("Raktárosként csak folyamatban lévő rendelést zárhat le!");
                }
            }

            if (currentStatus == "Planning" && newStatus != "Processing")
            {
                throw new BadRequestException("Egy 'Planning' (Tervezés) állapotú rendelést először 'Processing' (Összekészítés) állapotba kell léptetni!");
            }

            if (currentStatus == "Processing" && newStatus != "Closed")
            {
                throw new BadRequestException("Egy 'Processing' (Összekészítés) állapotú rendelést csak 'Closed' (Lezárva) állapotba lehet tenni!");
            }

            if (currentStatus == "Closed")
            {
                throw new BadRequestException("Egy már lezárt ('Closed') rendelés állapota utólag nem módosítható!");
            }

            if ((newStatus == "Processing" || newStatus == "Closed") && !order.Items.Any())
            {
                throw new BadRequestException("Egy rendelést nem lehet elindítani vagy lezárni úgy, hogy nincsenek benne tételek!");
            }

            if (newStatus == "Closed")
            {
                foreach (var item in order.Items)
                {
                    var stock = await _context.ProductStocks
                        .FirstOrDefaultAsync(ps => ps.CompartmentId == item.FromCompartmentId && ps.ProductId == item.ProductId);

                    if (stock == null || stock.Quantity < item.Quantity)
                    {
                        throw new BadRequestException($"Nincs elegendő készlet a(z) {item.ProductId} azonosítójú termékből a kiválasztott rekeszben! A lezárás megszakítva.");
                    }

                    stock.Quantity -= item.Quantity;

                    if (stock.Quantity == 0)
                    {
                        _context.ProductStocks.Remove(stock);
                    }

                    await _stockMovementLogic.CreateMovementAsync(new CreateStockMovementDto
                    {
                        ProductId = item.ProductId,
                        CompartmentId = item.FromCompartmentId,
                        QuantityChange = -item.Quantity,
                        MovementType = "Outbound",
                        TransactionId = order.Id,
                        CreatedByUserId = order.CreatedByUserId
                    });
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
                throw new BadRequestException("Szigorúan tilos törölni egy olyan rendelést, ami már feldolgozás alatt van vagy le lett zárva. Csak 'Planning' állapotú rendelések törölhetők!");
            }

            _context.Transactions.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
