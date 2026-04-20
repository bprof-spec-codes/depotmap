using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/warehouses/pathfinding")]
    public class WarehousePathFinding : ControllerBase
    {
        private readonly IWarehousePathFinding _pickingLogic;
        public WarehousePathFinding(IWarehousePathFinding pickingLogic)
        {
            _pickingLogic = pickingLogic;
        }

        [HttpPost("calculate-route")]
        public ActionResult<List<WarehouseCellDto>> CalculateRoute([FromBody] List<WarehouseCellDto> cellsToVisit)
        {
            var optimized = _pickingLogic.GetOptimizedRoute(cellsToVisit);
            return Ok(optimized);
        }
    }
}
