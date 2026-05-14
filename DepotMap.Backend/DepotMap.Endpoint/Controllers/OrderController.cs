using DepotMap.Entities.Models.DTOs.Transaction.Order;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderLogic _orderLogic;
        public OrderController(IOrderLogic orderLogic)
        {
            _orderLogic = orderLogic;
        }

        [HttpGet]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderLogic.GetAllOrdersAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetOrderById(string id)
        {
            var order = await _orderLogic.GetOrderByIdAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            return Ok(order);
        }

        [HttpPost]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var createdOrder = await _orderLogic.CreateOrderAsync(dto);
            return CreatedAtAction(nameof(GetOrderById), new { id = createdOrder.Id }, createdOrder);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> UpdateOrder(string id, [FromBody] UpdateOrderDto dto)
        {
            var updatedOrder = await _orderLogic.UpdateOrderAsync(id, dto);

            if (updatedOrder == null)
            {
                return NotFound();
            }
            
            return Ok(updatedOrder);
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusDto dto)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

            var updatedOrder = await _orderLogic.UpdateOrderStatusAsync(id, dto, userRole!);
            if (updatedOrder == null)
            {
                return NotFound();
            }
            
            return Ok(updatedOrder);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> DeleteOrder(string id)
        {
            var isDeleted = await _orderLogic.DeleteOrderAsync(id);
            
            if (!isDeleted)
            {
                return NotFound(new { message = "A törölni kívánt rendelés nem található." });
            }
            
            return NoContent();
        }
    }
}
