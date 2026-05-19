using DepotMap.Data.Context;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Helpers;
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

            if (IsShelfRemoval(cell.CellType, dto.CellType))
            {
                var hasShelf = await _context.Shelves.AnyAsync(s => s.WarehouseCellId == cellId);
                if (hasShelf)
                {
                    throw new ConflictException(
                        $"A(z) {cell.X}-{cell.Y} cella nem írható felül, mert polc van rajta. Előbb töröld a polcot.");
                }
            }

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

            // A shelf_area-ról elvett (átírt) cellák, amiken polc van: nem írhatók felül.
            var shelfRemovalCellIds = new List<string>();
            foreach (var update in dto.Cells)
            {
                var cell = cells.FirstOrDefault(c => c.X == update.X && c.Y == update.Y);
                if (cell != null && IsShelfRemoval(cell.CellType, update.CellType))
                {
                    shelfRemovalCellIds.Add(cell.Id);
                }
            }

            if (shelfRemovalCellIds.Count > 0)
            {
                var blockedCellIds = await _context.Shelves
                    .Where(s => shelfRemovalCellIds.Contains(s.WarehouseCellId))
                    .Select(s => s.WarehouseCellId)
                    .Distinct()
                    .ToListAsync();

                if (blockedCellIds.Count > 0)
                {
                    var coords = cells
                        .Where(c => blockedCellIds.Contains(c.Id))
                        .OrderBy(c => c.Y).ThenBy(c => c.X)
                        .Select(c => $"{c.X}-{c.Y}");

                    throw new ConflictException(
                        $"A következő cellák nem írhatók felül, mert polc van rajtuk: {string.Join(", ", coords)}. Előbb töröld a polcokat.");
                }
            }

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

        // shelf_area cella átírása bármi másra = a polc "elvétele" alóla.
        private static bool IsShelfRemoval(string currentType, string newType)
            => currentType == "shelf_area" && newType != "shelf_area";
    }
}
