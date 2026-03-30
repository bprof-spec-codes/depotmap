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
        private readonly IPurchasingTransactionItemLogic _purchasingTransactionItemLogic;

        public PurchasingTransactionsController(
            IPurchasingTransactionLogic purchasingTransactionLogic,
            IPurchasingTransactionItemLogic purchasingTransactionItemLogic)
        {
            _purchasingTransactionLogic = purchasingTransactionLogic;
            _purchasingTransactionItemLogic = purchasingTransactionItemLogic;
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

        [HttpPost("{transactionId}/items")]
        public async Task<IActionResult> AddItem(string transactionId, [FromBody] CreatePurchasingTransactionItemDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            try
            {
                var updated = await _purchasingTransactionItemLogic.AddItemAsync(transactionId, dto);

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
    }
}