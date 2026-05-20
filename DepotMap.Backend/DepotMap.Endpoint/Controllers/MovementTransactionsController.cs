using DepotMap.Entities.Models.DTOs.Transaction.Movement;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [Authorize]
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
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetAll()
        {
            var transactions = await _movementTransactionLogic.GetAllAsync();
            return Ok(transactions);
        }

        [HttpGet("table")]
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> GetTable(
            [FromQuery] int skip = 0,
            [FromQuery] int take = 500,
            [FromQuery] DateTime? date = null,
            [FromQuery] string? status = null,
            [FromQuery] string? createdByUserId = null,
            [FromQuery] string? productId = null,
            [FromQuery] string? fromCompartmentId = null,
            [FromQuery] string? toCompartmentId = null,
            [FromQuery] int? quantity = null)
        {
            var rows = await _movementTransactionLogic.GetTableRowsAsync(
                skip,
                take,
                date,
                status,
                createdByUserId,
                productId,
                fromCompartmentId,
                toCompartmentId,
                quantity);
            return Ok(rows);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Manager,Officer,Operator")]
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
        [Authorize(Roles = "Manager,Officer")]
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
        [Authorize(Roles = "Manager,Officer,Operator")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateMovementTransactionDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

            try
            {
                var updated = await _movementTransactionLogic.UpdateAsync(id, dto, userRole!);

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
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager,Officer")]
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
