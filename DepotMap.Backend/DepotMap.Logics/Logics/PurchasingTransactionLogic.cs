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
    public class PurchasingTransactionLogic : IPurchasingTransactionLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PurchasingTransactionLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<PurchasingTransactionViewDto>> GetAllAsync()
        {
            var transactions = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .Where(t => t.Type == "Inbound")
                .ToListAsync();

            return _mapper.Map<List<PurchasingTransactionViewDto>>(transactions);
        }

        public async Task<PurchasingTransactionViewDto?> GetByIdAsync(string id)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Items)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && t.Type == "Inbound");

            if (transaction == null) 
                return null;

            return _mapper.Map<PurchasingTransactionViewDto>(transaction);
        }

        public async Task<PurchasingTransactionViewDto> CreateAsync(CreatePurchasingTransactionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CreatedByUserId))
            {
                throw new InvalidOperationException("A CreatedByUserId kötelező.");
            }

            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.CreatedByUserId);
            if (!userExists)
            {
                throw new InvalidOperationException("A megadott felhasználó nem létezik.");
            }

            var transaction = _mapper.Map<Transaction>(dto);

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            await _context.Entry(transaction).Reference(t => t.CreatedBy).LoadAsync();

            return _mapper.Map<PurchasingTransactionViewDto>(transaction);
        }
    }
}