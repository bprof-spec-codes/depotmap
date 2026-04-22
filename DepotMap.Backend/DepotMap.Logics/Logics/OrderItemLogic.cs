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
    public class OrderItemLogic : IOrderItemLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public OrderItemLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<OrderViewDto?> AddItemToOrderAsync(string orderId, CreateOrderItemDto dto)
        {
            var order = await _context.Transactions
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.Id == orderId && t.Type == "Outbound");

            if (order == null) return null;

            if (order.Status != "Planning")
            {
                throw new InvalidOperationException("Csak 'Planning' státuszú rendelés módosítható!");
            }

            var product = await _context.Products.FirstOrDefaultAsync(p => p.SKU == dto.ProductSKU);
            if (product == null)
                throw new InvalidOperationException($"Nem található termék a következő cikkszámmal: {dto.ProductSKU}");

            string? compartmentId = null;
            if (!string.IsNullOrWhiteSpace(dto.FromCompartmentCode))
            {
                var comp = await _context.Compartments.FirstOrDefaultAsync(c => c.Code == dto.FromCompartmentCode);
                if (comp == null)
                    throw new InvalidOperationException($"Nem található rekesz a következő kóddal: {dto.FromCompartmentCode}");
                compartmentId = comp.Id;
            }

            var stock = await _context.ProductStocks
                .FirstOrDefaultAsync(ps => ps.CompartmentId == compartmentId && ps.ProductId == product.Id);

            if (stock == null)
            {
                throw new InvalidOperationException($"A megadott termék ({dto.ProductSKU}) nem található a kiválasztott rekeszben ({dto.FromCompartmentCode ?? "Nincs megadva"})!");
            }

            if (stock.Quantity < dto.Quantity)
            {
                throw new InvalidOperationException($"Nincs elég készlet a(z) {dto.ProductSKU} termékből! Elérhető: {stock.Quantity} db, kért mennyiség: {dto.Quantity} db.");
            }

            var newItem = new TransactionItem
            {
                Id = Guid.NewGuid().ToString(),
                Type = "Outbound",
                TransactionId = orderId,
                ProductId = product.Id,
                FromCompartmentId = compartmentId,
                Quantity = dto.Quantity
            };

            _context.TransactionItems.Add(newItem);
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

        public async Task<bool> DeleteItemFromOrderAsync(string orderId, string itemId)
        {
            var order = await _context.Transactions
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.Id == orderId && t.Type == "Outbound");

            if (order == null) return false;

            if (order.Status != "Planning")
            {
                throw new InvalidOperationException("Tételt törölni csak 'Planning' (Tervezés) állapotú rendelésből szabad!");
            }

            var item = order.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null) return false;

            _context.TransactionItems.Remove(item);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<OrderItemViewDto?> GetOrderItemByIdAsync(string orderId, string itemId)
        {
            var item = await _context.TransactionItems
                .Include(i => i.Product)
                .Include(i => i.FromCompartment)
                .FirstOrDefaultAsync(i => i.Id == itemId && i.TransactionId == orderId);

            if (item == null) return null;

            return _mapper.Map<OrderItemViewDto>(item);
        }

        public async Task<OrderItemViewDto?> UpdateOrderItemAsync(string orderId, string itemId, UpdateOrderItemDto dto)
        {
            var order = await _context.Transactions
                .Include(t => t.Items)
                .FirstOrDefaultAsync(t => t.Id == orderId && t.Type == "Outbound");

            if (order == null) return null;

            if (order.Status != "Planning")
            {
                throw new InvalidOperationException("Tételt módosítani csak 'Planning' (Tervezés) állapotú rendelésben szabad!");
            }

            var item = order.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null) return null;

            var product = await _context.Products.FirstOrDefaultAsync(p => p.SKU == dto.ProductSKU);
            if (product == null)
                throw new InvalidOperationException($"Nem található termék a következő cikkszámmal: {dto.ProductSKU}");

            string? compartmentId = null;
            if (!string.IsNullOrWhiteSpace(dto.FromCompartmentCode))
            {
                var comp = await _context.Compartments.FirstOrDefaultAsync(c => c.Code == dto.FromCompartmentCode);
                if (comp == null)
                    throw new InvalidOperationException($"Nem található rekesz a következő kóddal: {dto.FromCompartmentCode}");
                compartmentId = comp.Id;
            }

            var stock = await _context.ProductStocks
                .FirstOrDefaultAsync(ps => ps.CompartmentId == compartmentId && ps.ProductId == product.Id);

            if (stock == null)
            {
                throw new InvalidOperationException($"A megadott termék ({dto.ProductSKU}) nem található a kiválasztott rekeszben ({dto.FromCompartmentCode ?? "Nincs megadva"})!");
            }

            if (stock.Quantity < dto.Quantity)
            {
                throw new InvalidOperationException($"Nincs elég készlet a(z) {dto.ProductSKU} termékből! Elérhető: {stock.Quantity} db, kért mennyiség: {dto.Quantity} db.");
            }

            item.ProductId = product.Id;
            item.FromCompartmentId = compartmentId;
            item.Quantity = dto.Quantity;

            await _context.SaveChangesAsync();

            await _context.Entry(item).Reference(i => i.Product).LoadAsync();
            if (item.FromCompartmentId != null)
                await _context.Entry(item).Reference(i => i.FromCompartment).LoadAsync();

            return _mapper.Map<OrderItemViewDto>(item);
        }
    }
}
