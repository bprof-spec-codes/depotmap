using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/warehouses/{warehouseId}/cells")]
    // [Authorize]
    public class WarehouseCellController : ControllerBase
    {
        private readonly IWarehouseCellLogic _cellLogic;

        public WarehouseCellController(IWarehouseCellLogic cellLogic)
        {
            _cellLogic = cellLogic;
        }

        [HttpGet]
        public async Task<ActionResult<List<WarehouseCellDto>>> GetAll(string warehouseId)
        {
            var cells = await _cellLogic.GetCellsByWarehouseIdAsync(warehouseId);
            return Ok(cells);
        }

        [HttpGet("{cellId}")]
        public async Task<ActionResult<CellDetailDto>> GetDetail(string warehouseId, string cellId)
        {
            var cell = await _cellLogic.GetCellDetailAsync(cellId);
            if (cell == null)
                return NotFound();

            return Ok(cell);
        }

        [HttpPut("{cellId}")]
        public async Task<ActionResult<WarehouseCellDto>> UpdateCellType(string warehouseId, string cellId, [FromBody] UpdateCellTypeDto dto)
        {
            var cell = await _cellLogic.UpdateCellTypeAsync(cellId, dto);
            if (cell == null)
                return NotFound();

            return Ok(cell);
        }

        [HttpPut("batch")]
        public async Task<ActionResult<List<WarehouseCellDto>>> BatchUpdate(string warehouseId, [FromBody] BatchUpdateCellsDto dto)
        {
            var cells = await _cellLogic.BatchUpdateCellsAsync(warehouseId, dto);
            return Ok(cells);
        }
    }
}
