using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.StockMovement;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class StockMovementLogic: IStockMovementLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public StockMovementLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<StockMovementViewDto>> GetAllMovementsAsync()
        {
            var movements = await _context.StockMovements
                .OrderByDescending(sm => sm.Timestamp)
                .ToListAsync();

            return _mapper.Map<IEnumerable<StockMovementViewDto>>(movements);
        }

        public async Task<IEnumerable<StockMovementViewDto>> GetMovementsByProductAsync(string productId)
        {
            var movements = await _context.StockMovements
                .Where(sm => sm.ProductId == productId)
                .OrderByDescending(sm => sm.Timestamp)
                .ToListAsync();

            return _mapper.Map<IEnumerable<StockMovementViewDto>>(movements);
        }

        public async Task CreateMovementAsync(CreateStockMovementDto dto)
        {
            var movement = _mapper.Map<StockMovement>(dto);
            movement.Id = Guid.NewGuid().ToString();
            movement.Timestamp = DateTime.UtcNow;

            _context.StockMovements.Add(movement);
            await _context.SaveChangesAsync();
        }
    }
}
