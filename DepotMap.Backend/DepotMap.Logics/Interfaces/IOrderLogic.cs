using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.Transaction.Order;

namespace DepotMap.Logics.Interfaces
{
    public interface IOrderLogic
    {
        Task<List<OrderViewDto>> GetAllOrdersAsync();
        Task<OrderViewDto?> GetOrderByIdAsync(string id); 
        Task<OrderViewDto?> CreateOrderAsync(CreateOrderDto dto);
        Task<OrderViewDto?> UpdateOrderAsync(string id, UpdateOrderDto dto); 
        Task<OrderViewDto?> UpdateOrderStatusAsync(string id, UpdateOrderStatusDto dto); 
        Task<bool> DeleteOrderAsync(string id);
    }
}
