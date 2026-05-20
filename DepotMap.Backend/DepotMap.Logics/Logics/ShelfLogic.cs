using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Entities.Models.DTOs.Products;
using DepotMap.Logics.Helpers;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class ShelfLogic : IShelfLogic
    {
        private readonly AppDbContext _context;

        public ShelfLogic(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ShelfListDto>> GetShelvesByCellIdAsync(string cellId)
        {
            return await _context.Shelves
                .Where(s => s.WarehouseCellId == cellId)
                .Select(s => new ShelfListDto
                {
                    Id = s.Id,
                    Code = s.Code,
                    X = s.X,
                    Y = s.Y,
                    Levels = s.Levels,
                    AccessibleFromBothSides = s.AccessibleFromBothSides
                })
                .ToListAsync();
        }

        public async Task<ShelfDetailDto?> GetShelfDetailAsync(string shelfId)
        {
            var shelf = await _context.Shelves
                .Include(s => s.Compartments)
                    .ThenInclude(c => c.ProductStocks)
                        .ThenInclude(ps => ps.Product)
                .FirstOrDefaultAsync(s => s.Id == shelfId);

            if (shelf == null) return null;

            return MapToShelfDetailDto(shelf);
        }

        public async Task<ShelfListDto> CreateShelfAsync(string cellId, CreateShelfDto dto)
        {
            var cell = await _context.WarehouseCells
                .FirstOrDefaultAsync(c => c.Id == cellId);

            if (cell == null) throw new NotFoundException("A megadott cella nem található.");

            var alreadyHasShelf = await _context.Shelves.AnyAsync(s => s.WarehouseCellId == cellId);
            if (alreadyHasShelf) throw new ConflictException("A cellában már van polc.");

            var code = $"{cell.X}-{cell.Y}";

            var shelf = new Shelf
            {
                WarehouseId = cell.WarehouseId,
                WarehouseCellId = cellId,
                X = dto.X,
                Y = dto.Y,
                Levels = dto.Levels,
                AccessibleFromBothSides = dto.AccessibleFromBothSides,
                LadderRequiredFromLevel = dto.LadderRequiredFromLevel,
                Code = code
            };

            _context.Shelves.Add(shelf);
            await _context.SaveChangesAsync();

            return new ShelfListDto
            {
                Id = shelf.Id,
                Code = shelf.Code,
                X = shelf.X,
                Y = shelf.Y,
                Levels = shelf.Levels,
                AccessibleFromBothSides = shelf.AccessibleFromBothSides
            };
        }

        public async Task<ShelfListDto?> UpdateShelfAsync(string shelfId, UpdateShelfDto dto)
        {
            var shelf = await _context.Shelves.FindAsync(shelfId);
            if (shelf == null) return null;

            shelf.Levels = dto.Levels;
            shelf.AccessibleFromBothSides = dto.AccessibleFromBothSides;
            shelf.LadderRequiredFromLevel = dto.LadderRequiredFromLevel;

            await _context.SaveChangesAsync();

            return new ShelfListDto
            {
                Id = shelf.Id,
                Code = shelf.Code,
                X = shelf.X,
                Y = shelf.Y,
                Levels = shelf.Levels,
                AccessibleFromBothSides = shelf.AccessibleFromBothSides
            };
        }

        public async Task<bool> DeleteShelfAsync(string shelfId)
        {
            var shelf = await _context.Shelves.FindAsync(shelfId);
            if (shelf == null) return false;

            var compartmentIds = await _context.Compartments
                .Where(c => c.ShelfId == shelfId)
                .Select(c => c.Id)
                .ToListAsync();

            await EnsureNoMovementReferencesAsync(compartmentIds, "A polc");

            _context.Shelves.Remove(shelf);
            await _context.SaveChangesAsync();
            return true;
        }

        // A StockMovement / TransactionItem FK-k Restrict-ek, így a cascade-törlés
        // (Warehouse→Cell→Shelf→Compartment) SQL szinten elhasalna, ha mozgás vagy
        // tranzakció hivatkozik a rekeszre. Itt előre, érthető hibával jelezzük.
        private async Task EnsureNoMovementReferencesAsync(List<string> compartmentIds, string entityLabel)
        {
            if (compartmentIds.Count == 0) return;

            var hasStockMovement = await _context.StockMovements
                .AnyAsync(sm => compartmentIds.Contains(sm.CompartmentId));

            var hasTransactionItem = await _context.TransactionItems
                .AnyAsync(ti =>
                    (ti.FromCompartmentId != null && compartmentIds.Contains(ti.FromCompartmentId)) ||
                    (ti.ToCompartmentId != null && compartmentIds.Contains(ti.ToCompartmentId)));

            if (hasStockMovement || hasTransactionItem)
            {
                throw new ConflictException(
                    $"{entityLabel} nem törölhető, mert már kapcsolódik hozzá készletmozgás vagy tranzakció.");
            }
        }

        public async Task<ShelfDetailDto?> AddCompartmentToLevelAsync(string shelfId, int levelIndex)
        {
            var shelf = await _context.Shelves
                .Include(s => s.Compartments)
                    .ThenInclude(c => c.ProductStocks)
                        .ThenInclude(ps => ps.Product)
                .Include(s => s.WarehouseCell)
                    .ThenInclude(wc => wc.Warehouse)
                .FirstOrDefaultAsync(s => s.Id == shelfId);

            if (shelf == null) return null;

            var levelCompartments = shelf.Compartments
                .Where(c => c.LevelIndex == levelIndex)
                .ToList();

            int nextSlotIndex = levelCompartments.Count;
            var warehouseName = shelf.WarehouseCell.Warehouse.Name;

            var compartment = new Compartment
            {
                ShelfId = shelfId,
                LevelIndex = levelIndex,
                SlotIndex = nextSlotIndex,
                Code = GenerateCompartmentCode(warehouseName, shelf.Code, levelIndex, nextSlotIndex)
            };

            _context.Compartments.Add(compartment);
            await _context.SaveChangesAsync();

            // Re-fetch to include the new compartment
            shelf = await _context.Shelves
                .Include(s => s.Compartments)
                    .ThenInclude(c => c.ProductStocks)
                        .ThenInclude(ps => ps.Product)
                .FirstOrDefaultAsync(s => s.Id == shelfId);

            return MapToShelfDetailDto(shelf!);
        }

        public async Task<ShelfDetailDto?> RemoveCompartmentFromLevelAsync(string shelfId, int levelIndex)
        {
            var shelf = await _context.Shelves
                .Include(s => s.Compartments)
                    .ThenInclude(c => c.ProductStocks)
                        .ThenInclude(ps => ps.Product)
                .FirstOrDefaultAsync(s => s.Id == shelfId);

            if (shelf == null) return null;

            var levelCompartments = shelf.Compartments
                .Where(c => c.LevelIndex == levelIndex)
                .OrderBy(c => c.SlotIndex)
                .ToList();

            if (levelCompartments.Count == 0) return MapToShelfDetailDto(shelf);

            // Remove the last compartment on this level
            var lastCompartment = levelCompartments.Last();

            await EnsureNoMovementReferencesAsync(new List<string> { lastCompartment.Id }, "A rekesz");

            _context.Compartments.Remove(lastCompartment);
            await _context.SaveChangesAsync();

            // Re-fetch
            shelf = await _context.Shelves
                .Include(s => s.Compartments)
                    .ThenInclude(c => c.ProductStocks)
                        .ThenInclude(ps => ps.Product)
                .FirstOrDefaultAsync(s => s.Id == shelfId);

            return MapToShelfDetailDto(shelf!);
        }

        private static ShelfDetailDto MapToShelfDetailDto(Shelf shelf)
        {
            return new ShelfDetailDto
            {
                Id = shelf.Id,
                Code = shelf.Code,
                X = shelf.X,
                Y = shelf.Y,
                Levels = shelf.Levels,
                AccessibleFromBothSides = shelf.AccessibleFromBothSides,
                LadderRequiredFromLevel = shelf.LadderRequiredFromLevel,
                Compartments = shelf.Compartments
                    .OrderBy(c => c.LevelIndex)
                    .ThenBy(c => c.SlotIndex)
                    .Select(c => new CompartmentDto
                    {
                        Id = c.Id,
                        LevelIndex = c.LevelIndex,
                        SlotIndex = c.SlotIndex,
                        Code = c.Code,
                        ProductStocks = c.ProductStocks.Select(ps => new ProductStockInfoDto
                        {
                            ProductId = ps.Product.Id,
                            ProductName = ps.Product.Name,
                            SKU = ps.Product.SKU,
                            Quantity = ps.Quantity
                        }).ToList()
                    }).ToList()
            };
        }

        // Format: [WarehouseName first char].[ShelfCode].[Level].[Slot]
        private static string GenerateCompartmentCode(string warehouseName, string shelfCode, int levelIndex, int slotIndex)
        {
            var warehouseMark = warehouseName.Length > 0 ? warehouseName[0].ToString().ToUpper() : "W";
            return $"{warehouseMark}.{shelfCode}.{levelIndex + 1}.{slotIndex + 1}";
        }
    }
}
