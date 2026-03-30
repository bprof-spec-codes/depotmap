using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class WarehouseLogic : IWarehouseLogic
    {
        private readonly AppDbContext _context;

        public WarehouseLogic(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<WarehouseListDto>> GetAllAsync()
        {
            return await _context.Warehouses
                .Select(w => new WarehouseListDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    GridWidth = w.GridWidth,
                    GridHeight = w.GridHeight
                })
                .ToListAsync();
        }

        public async Task<WarehouseDetailDto?> GetByIdAsync(string id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.Cells)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null) return null;

            return new WarehouseDetailDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                GridWidth = warehouse.GridWidth,
                GridHeight = warehouse.GridHeight,
                Cells = warehouse.Cells.Select(c => new WarehouseCellDto
                {
                    Id = c.Id,
                    X = c.X,
                    Y = c.Y,
                    CellType = c.CellType
                }).ToList()
            };
        }

        public async Task<WarehouseListDto> CreateAsync(CreateWarehouseDto dto)
        {
            var warehouse = new Warehouse
            {
                Name = dto.Name,
                GridWidth = dto.GridWidth,
                GridHeight = dto.GridHeight
            };

            _context.Warehouses.Add(warehouse);

            // Generate all cells with default "corridor" type
            for (int x = 0; x < dto.GridWidth; x++)
            {
                for (int y = 0; y < dto.GridHeight; y++)
                {
                    _context.WarehouseCells.Add(new WarehouseCell
                    {
                        WarehouseId = warehouse.Id,
                        X = x,
                        Y = y,
                        CellType = "corridor"
                    });
                }
            }

            await _context.SaveChangesAsync();

            return new WarehouseListDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                GridWidth = warehouse.GridWidth,
                GridHeight = warehouse.GridHeight
            };
        }

        public async Task<WarehouseListDto?> UpdateAsync(string id, UpdateWarehouseDto dto)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return null;

            warehouse.Name = dto.Name;
            warehouse.GridWidth = dto.GridWidth;
            warehouse.GridHeight = dto.GridHeight;

            await _context.SaveChangesAsync();

            return new WarehouseListDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                GridWidth = warehouse.GridWidth,
                GridHeight = warehouse.GridHeight
            };
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null) return false;

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
