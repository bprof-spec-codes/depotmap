using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/warehouses")]
    // [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly IWarehouseLogic _warehouseLogic;

        public WarehouseController(IWarehouseLogic warehouseLogic)
        {
            _warehouseLogic = warehouseLogic;
        }

        [HttpGet]
        public async Task<ActionResult<List<WarehouseListDto>>> GetAll()
        {
            var warehouses = await _warehouseLogic.GetAllAsync();
            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseDetailDto>> GetById(string id)
        {
            var warehouse = await _warehouseLogic.GetByIdAsync(id);
            if (warehouse == null)
                return NotFound();

            return Ok(warehouse);
        }

        [HttpPost]
        public async Task<ActionResult<WarehouseListDto>> Create([FromBody] CreateWarehouseDto dto)
        {
            var warehouse = await _warehouseLogic.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = warehouse.Id }, warehouse);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<WarehouseListDto>> Update(string id, [FromBody] UpdateWarehouseDto dto)
        {
            var warehouse = await _warehouseLogic.UpdateAsync(id, dto);
            if (warehouse == null)
                return NotFound();

            return Ok(warehouse);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _warehouseLogic.DeleteAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}
