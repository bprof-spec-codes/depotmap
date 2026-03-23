using DepotMap.Entities.Models.DTOs.Products;
using DepotMap.Logics.Logics;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ProductsLogic _productsLogic;
        public ProductsController(ProductsLogic productsLogic)
        {
            _productsLogic = productsLogic;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {

            await _productsLogic.CreateProductAsync(dto);
            return Ok("Product created successfully.");

        }
    }
}
