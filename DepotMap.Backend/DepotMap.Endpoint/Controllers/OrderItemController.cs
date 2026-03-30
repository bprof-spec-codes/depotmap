using DepotMap.Entities.Models.DTOs.Transaction.Order;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
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
        public async Task<IActionResult> AddItemToOrder(string orderId, [FromBody] CreateOrderItemDto dto)
        {
            try
            {
                var updatedOrder = await _orderItemLogic.AddItemToOrderAsync(orderId, dto);

                if (updatedOrder == null) return NotFound(new { message = "A rendelés nem található." });

                return Ok(updatedOrder);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{orderId}/items/{itemId}")]
        public async Task<IActionResult> DeleteItemFromOrder(string orderId, string itemId)
        {
            try
            {
                var isDeleted = await _orderItemLogic.DeleteItemFromOrderAsync(orderId, itemId);

                if (!isDeleted) return NotFound(new { message = "A rendelés vagy a tétel nem található." });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{orderId}/items/{itemId}")]
        public async Task<IActionResult> GetOrderItemById(string orderId, string itemId)
        {
            var item = await _orderItemLogic.GetOrderItemByIdAsync(orderId, itemId);

            if (item == null)
            {
                return NotFound(new { message = "A rendelés vagy a tétel nem található." });
            }

            return Ok(item);
        }

        [HttpPut("{orderId}/items/{itemId}")]
        public async Task<IActionResult> UpdateOrderItem(string orderId, string itemId, [FromBody] UpdateOrderItemDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var updatedItem = await _orderItemLogic.UpdateOrderItemAsync(orderId, itemId, dto);

                if (updatedItem == null) return NotFound(new { message = "A frissíteni kívánt tétel vagy rendelés nem található." });

                return Ok(updatedItem);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
