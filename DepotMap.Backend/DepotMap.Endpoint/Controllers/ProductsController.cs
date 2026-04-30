using DepotMap.Entities.Models.DTOs.Products;
using DepotMap.Logics.Logics;
using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Roles = "")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {

            await _productsLogic.CreateProductAsync(dto);
            return Ok("Product created successfully.");

        }
        [HttpGet]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetAllProducts()
        {
            var products = await _productsLogic.GetAllProductsAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetProductById(string id)
        {
            var product = await _productsLogic.GetProductByIdAsync(id);
            if (product == null)
                return NotFound();

            return Ok(product);
        }
        [HttpGet("history")]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetHistory([FromQuery] string? productId)
        {
            var historyDtos = await _productsLogic.GetProductHistoryAsync(productId);
            return Ok(historyDtos);
        }
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> UpdateProduct(string id, [FromBody] CreateProductDto dto)
        {
            var userId = "seed-admin-001"; // User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();
            await _productsLogic.UpdateProductAsync(id, dto, userId);
            return Ok("Product updated successfully.");
        }
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Officer")]
        public async Task<IActionResult> DeleteProduct(string id)
        {
            var userId = "seed-admin-001"; //User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();
            await _productsLogic.DeleteProductAsync(id, userId);
            return Ok("Product deleted successfully.");
        }

    }
}
