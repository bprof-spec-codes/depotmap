using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Transaction.Purchasing;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class PurchasingTransactionItemLogic : IPurchasingTransactionItemLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PurchasingTransactionItemLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PurchasingTransactionViewDto?> AddItemAsync(string transactionId, CreatePurchasingTransactionItemDto dto)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == transactionId && t.Type == "Inbound");

            if (transaction == null) 
                return null;

            if (transaction.Status != "Planning")
            {
                throw new InvalidOperationException("Csak 'Planning' státuszú beszerzéshez lehet tételt hozzáadni.");
            }

            if (string.IsNullOrWhiteSpace(dto.ProductId))
            {
                throw new InvalidOperationException("A ProductId kötelező.");
            }

            if (string.IsNullOrWhiteSpace(dto.ToCompartmentId))
            {
                throw new InvalidOperationException("A ToCompartmentId kötelező.");
            }

            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists)
            {
                throw new InvalidOperationException("A megadott termék nem létezik.");
            }

            var compartmentExists = await _context.Compartments.AnyAsync(c => c.Id == dto.ToCompartmentId);
            if (!compartmentExists)
            {
                throw new InvalidOperationException("A megadott rekesz nem létezik.");
            }

            var item = _mapper.Map<TransactionItem>(dto);
            item.TransactionId = transactionId;

            _context.TransactionItems.Add(item);
            await _context.SaveChangesAsync();

            var refreshed = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == transactionId && t.Type == "Inbound");

            return _mapper.Map<PurchasingTransactionViewDto>(refreshed);
        }
    }
}