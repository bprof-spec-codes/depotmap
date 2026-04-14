using DepotMap.Data.Context;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class CompartmentLogic : ICompartmentLogic
    {
        private readonly AppDbContext _context;

        public CompartmentLogic(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CompartmentDto>> GetAllCompartmentsAsync()
        {
            var compartments = await _context.Compartments
                .Include(c => c.ProductStocks)
                    .ThenInclude(ps => ps.Product)
                .OrderBy(c => c.Code)
                .ToListAsync();

            return compartments.Select(MapToDto).ToList();
        }

        public async Task<CompartmentDto?> GetCompartmentByIdAsync(string compartmentId)
        {
            var compartment = await _context.Compartments
                .Include(c => c.ProductStocks)
                    .ThenInclude(ps => ps.Product)
                .FirstOrDefaultAsync(c => c.Id == compartmentId);

            return compartment == null ? null : MapToDto(compartment);
        }

        private static CompartmentDto MapToDto(Entities.Models.Compartment compartment)
        {
            return new CompartmentDto
            {
                Id = compartment.Id,
                LevelIndex = compartment.LevelIndex,
                SlotIndex = compartment.SlotIndex,
                Code = compartment.Code,
                ProductStocks = compartment.ProductStocks.Select(ps => new DepotMap.Entities.Models.DTOs.Products.ProductStockInfoDto
                {
                    ProductId = ps.ProductId,
                    ProductName = ps.Product.Name,
                    SKU = ps.Product.SKU,
                    CompartmentId = ps.CompartmentId,
                    Quantity = ps.Quantity
                }).ToList()
            };
        }
    }
}
