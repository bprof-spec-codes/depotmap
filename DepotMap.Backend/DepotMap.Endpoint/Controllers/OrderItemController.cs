using DepotMap.Entities.Models.DTOs.Transaction.Order;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class OrderItemController : ControllerBase
    {
        private readonly IOrderItemLogic _orderItemLogic;

        public OrderItemController(IOrderItemLogic orderLogic)
        {
            _orderItemLogic = orderLogic;
        }

        [HttpPost("{orderId}/items")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> AddItemToOrder(string orderId, [FromBody] CreateOrderItemDto dto)
        {
            var updatedOrder = await _orderItemLogic.AddItemToOrderAsync(orderId, dto);

            if (updatedOrder == null) 
                return NotFound();

            return Ok(updatedOrder);
        }

        [HttpDelete("{orderId}/items/{itemId}")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> DeleteItemFromOrder(string orderId, string itemId)
        {
            var isDeleted = await _orderItemLogic.DeleteItemFromOrderAsync(orderId, itemId);

            if (!isDeleted) 
                return NotFound();

            return NoContent();
        }

        [HttpGet("{orderId}/items/{itemId}")]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetOrderItemById(string orderId, string itemId)
        {
            var item = await _orderItemLogic.GetOrderItemByIdAsync(orderId, itemId);

            if (item == null)
            {
                return NotFound();
            }

            return Ok(item);
        }

        [HttpPut("{orderId}/items/{itemId}")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> UpdateOrderItem(string orderId, string itemId, [FromBody] UpdateOrderItemDto dto)
        {
            var updatedItem = await _orderItemLogic.UpdateOrderItemAsync(orderId, itemId, dto);

            if (updatedItem == null) 
                return NotFound();

            return Ok(updatedItem);
        }
    }
}
