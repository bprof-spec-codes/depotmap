using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockMovementController : ControllerBase
    {
        private readonly IStockMovementLogic _logic;

        public StockMovementController(IStockMovementLogic logic)
        {
            _logic = logic;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMovements()
        {
            var movements = await _logic.GetAllMovementsAsync();
            return Ok(movements);
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetMovementsByProduct(string productId)
        {
            var movements = await _logic.GetMovementsByProductAsync(productId);
            return Ok(movements);
        }
    }
}
