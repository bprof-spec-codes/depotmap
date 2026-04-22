using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using DepotMap.Logics.Logics;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehousePathFindingController : ControllerBase
    {
        private readonly IWarehousePathFinding _pathFindingLogic;

        public WarehousePathFindingController(IWarehousePathFinding pathFindingLogic)
        {
            _pathFindingLogic = pathFindingLogic;
        }

        [HttpGet("optimize/{transactionId}")]
        public async Task<ActionResult<List<PickingTaskDto>>> GetOptimizedRoute(string transactionId)
        {
            var result = await _pathFindingLogic.GetOrderPickingRouteAsync(transactionId);

            if (result == null || result.Count == 0)
            {
                return NotFound(new { Message = "Nem található kiszedhető tétel ehhez a tranzakcióhoz." });
            }

            return Ok(result);
        }
    }
}
