using DepotMap.Data.Context;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class WarehouseCellLogic : IWarehouseCellLogic
    {
        private readonly AppDbContext _context;

        public WarehouseCellLogic(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<WarehouseCellDto>> GetCellsByWarehouseIdAsync(string warehouseId)
        {
            return await _context.WarehouseCells
                .Where(c => c.WarehouseId == warehouseId)
                .Select(c => new WarehouseCellDto
                {
                    Id = c.Id,
                    X = c.X,
                    Y = c.Y,
                    CellType = c.CellType
                })
                .ToListAsync();
        }

        public async Task<CellDetailDto?> GetCellDetailAsync(string cellId)
        {
            var cell = await _context.WarehouseCells
                .Include(c => c.Shelves)
                .FirstOrDefaultAsync(c => c.Id == cellId);

            if (cell == null) return null;

            return new CellDetailDto
            {
                Id = cell.Id,
                X = cell.X,
                Y = cell.Y,
                CellType = cell.CellType,
                Shelves = cell.Shelves.Select(s => new ShelfListDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    X = s.X,
                    Y = s.Y,
                    Levels = s.Levels,
                    AccessibleFromBothSides = s.AccessibleFromBothSides
                }).ToList()
            };
        }

        public async Task<WarehouseCellDto?> UpdateCellTypeAsync(string cellId, UpdateCellTypeDto dto)
        {
            var cell = await _context.WarehouseCells.FindAsync(cellId);
            if (cell == null) return null;

            cell.CellType = dto.CellType;
            await _context.SaveChangesAsync();

            return new WarehouseCellDto
            {
                Id = cell.Id,
                X = cell.X,
                Y = cell.Y,
                CellType = cell.CellType
            };
        }

        public async Task<List<WarehouseCellDto>> BatchUpdateCellsAsync(string warehouseId, BatchUpdateCellsDto dto)
        {
            var cells = await _context.WarehouseCells
                .Where(c => c.WarehouseId == warehouseId)
                .ToListAsync();

            foreach (var update in dto.Cells)
            {
                var cell = cells.FirstOrDefault(c => c.X == update.X && c.Y == update.Y);
                if (cell != null)
                {
                    cell.CellType = update.CellType;
                }
            }

            await _context.SaveChangesAsync();

            return cells.Select(c => new WarehouseCellDto
            {
                Id = c.Id,
                X = c.X,
                Y = c.Y,
                CellType = c.CellType
            }).ToList();
        }
    }
}
