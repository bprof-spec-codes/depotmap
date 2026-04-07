using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductStockController : ControllerBase
    {
        private readonly IProductStockLogic _logic;

        public ProductStockController(IProductStockLogic logic)
        {
            _logic = logic;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _logic.GetAllStocksAsync());
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProduct(string productId)
        {
            var results = await _logic.GetStocksByProductAsync(productId);
            return Ok(results);
        }

        [HttpGet("compartment/{compartmentId}")]
        public async Task<IActionResult> GetByCompartment(string compartmentId)
        {
            var results = await _logic.GetStocksByCompartmentAsync(compartmentId);
            return Ok(results);
        }
    }
}
