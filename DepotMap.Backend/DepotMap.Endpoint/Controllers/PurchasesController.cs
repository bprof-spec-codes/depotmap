using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PurchasesController : ControllerBase
    {
        private readonly IPurchaseLogic _purchaseLogic;

        public PurchasesController(IPurchaseLogic purchaseLogic)
        {
            _purchaseLogic = purchaseLogic;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized("User id is missing in token.");

            try
            {
                var transactionId = await _purchaseLogic.CreatePurchaseAsync(dto, userId);
                return Ok(new { transactionId });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}