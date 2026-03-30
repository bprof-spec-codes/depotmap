using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.Transaction.Order;

namespace DepotMap.Logics.Interfaces
{
    public interface IOrderItemLogic
    {
        Task<OrderViewDto?> AddItemToOrderAsync(string orderId, CreateOrderItemDto dto);
        Task<bool> DeleteItemFromOrderAsync(string orderId, string itemId);
        Task<OrderItemViewDto?> GetOrderItemByIdAsync(string orderId, string itemId);
        Task<OrderItemViewDto?> UpdateOrderItemAsync(string orderId, string itemId, UpdateOrderItemDto dto);
    }
}
