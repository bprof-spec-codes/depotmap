using DepotMap.Entities.Models.DTOs.Transaction.Movement;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/movement/transactions")]
    public class MovementTransactionsController : ControllerBase
    {
        private readonly IMovementTransactionLogic _movementTransactionLogic;

        public MovementTransactionsController(IMovementTransactionLogic movementTransactionLogic)
        {
            _movementTransactionLogic = movementTransactionLogic;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var transactions = await _movementTransactionLogic.GetAllAsync();
            return Ok(transactions);
        }

        [HttpGet("table")]
        public async Task<IActionResult> GetTable([FromQuery] int skip = 0, [FromQuery] int take = 500)
        {
            var rows = await _movementTransactionLogic.GetTableRowsAsync(skip, take);
            return Ok(rows);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var transaction = await _movementTransactionLogic.GetByIdAsync(id);

            if (transaction == null)
            {
                return NotFound(new { message = "A mozgatás nem található." });
            }

            return Ok(transaction);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMovementTransactionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var created = await _movementTransactionLogic.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateMovementTransactionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var updated = await _movementTransactionLogic.UpdateAsync(id, dto);

                if (updated == null)
                {
                    return NotFound(new { message = "A mozgatás nem található." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _movementTransactionLogic.DeleteAsync(id);

                if (!deleted)
                {
                    return NotFound(new { message = "A mozgatás nem található." });
                }

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
