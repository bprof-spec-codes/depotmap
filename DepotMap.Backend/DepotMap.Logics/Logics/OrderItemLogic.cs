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

            var stock = await _context.ProductStocks
                .FirstOrDefaultAsync(ps => ps.CompartmentId == dto.FromCompartmentId && ps.ProductId == dto.ProductId);

            if (stock == null)
            {
                throw new InvalidOperationException("A megadott termék nem található a kiválasztott rekeszben, vagy a rekesz nem létezik!");
            }

            if (stock.Quantity < dto.Quantity)
            {
                throw new InvalidOperationException($"Nincs elég készlet! Elérhető: {stock.Quantity} db, kért mennyiség: {dto.Quantity} db.");
            }

            var newItem = _mapper.Map<TransactionItem>(dto);
            newItem.TransactionId = orderId;

            _context.TransactionItems.Add(newItem);
            await _context.SaveChangesAsync();

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

            _mapper.Map(dto, item);
            await _context.SaveChangesAsync();

            return _mapper.Map<OrderItemViewDto>(item);
        }
    }
}
