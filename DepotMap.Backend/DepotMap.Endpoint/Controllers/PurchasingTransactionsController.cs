using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.Transaction.Purchasing;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/purchasing/transactions")]
    public class PurchasingTransactionsController : ControllerBase
    {
        private readonly IPurchasingTransactionLogic _purchasingTransactionLogic;

        public PurchasingTransactionsController(IPurchasingTransactionLogic purchasingTransactionLogic)
        {
            _purchasingTransactionLogic = purchasingTransactionLogic;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var transactions = await _purchasingTransactionLogic.GetAllAsync();
            return Ok(transactions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var transaction = await _purchasingTransactionLogic.GetByIdAsync(id);

            if (transaction == null)
            {
                return NotFound(new { message = "A beszerzés nem található." });
            }

            return Ok(transaction);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePurchasingTransactionDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            try
            {
                var created = await _purchasingTransactionLogic.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdatePurchasingTransactionDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var updated = await _purchasingTransactionLogic.UpdateAsync(id, dto);

                if (updated == null)
                {
                    return NotFound(new { message = "A beszerzés nem található." });
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
                var deleted = await _purchasingTransactionLogic.DeleteAsync(id);

                if (!deleted)
                {
                    return NotFound(new { message = "A beszerzés nem található." });
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