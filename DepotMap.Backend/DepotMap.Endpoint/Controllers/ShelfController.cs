using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/cells/{cellId}/shelves")]
    // [Authorize]
    public class ShelfController : ControllerBase
    {
        private readonly IShelfLogic _shelfLogic;

        public ShelfController(IShelfLogic shelfLogic)
        {
            _shelfLogic = shelfLogic;
        }

        [HttpGet]
        public async Task<ActionResult<List<ShelfListDto>>> GetAll(string cellId)
        {
            var shelves = await _shelfLogic.GetShelvesByCellIdAsync(cellId);
            return Ok(shelves);
        }

        [HttpGet("{shelfId}")]
        public async Task<ActionResult<ShelfDetailDto>> GetDetail(string cellId, string shelfId)
        {
            var shelf = await _shelfLogic.GetShelfDetailAsync(shelfId);
            if (shelf == null)
                return NotFound();

            return Ok(shelf);
        }

        [HttpPost]
        public async Task<ActionResult<ShelfListDto>> Create(string cellId, [FromBody] CreateShelfDto dto)
        {
            var shelf = await _shelfLogic.CreateShelfAsync(cellId, dto);
            return CreatedAtAction(nameof(GetDetail), new { cellId, shelfId = shelf.Id }, shelf);
        }

        [HttpPut("{shelfId}")]
        public async Task<ActionResult<ShelfListDto>> Update(string cellId, string shelfId, [FromBody] UpdateShelfDto dto)
        {
            var shelf = await _shelfLogic.UpdateShelfAsync(shelfId, dto);
            if (shelf == null)
                return NotFound();

            return Ok(shelf);
        }

        [HttpDelete("{shelfId}")]
        public async Task<IActionResult> Delete(string cellId, string shelfId)
        {
            var result = await _shelfLogic.DeleteShelfAsync(shelfId);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPost("/api/shelves/{shelfId}/levels/{levelIndex}/compartments")]
        public async Task<ActionResult<ShelfDetailDto>> AddCompartment(string shelfId, int levelIndex)
        {
            var shelf = await _shelfLogic.AddCompartmentToLevelAsync(shelfId, levelIndex);
            if (shelf == null)
                return NotFound();

            return Ok(shelf);
        }

        [HttpDelete("/api/shelves/{shelfId}/levels/{levelIndex}/compartments")]
        public async Task<ActionResult<ShelfDetailDto>> RemoveCompartment(string shelfId, int levelIndex)
        {
            var shelf = await _shelfLogic.RemoveCompartmentFromLevelAsync(shelfId, levelIndex);
            if (shelf == null)
                return NotFound();

            return Ok(shelf);
        }
    }
}
