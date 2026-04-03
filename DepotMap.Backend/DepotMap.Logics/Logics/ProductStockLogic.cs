using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models.DTOs.StockMovement;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Logics.Logics
{
    public class ProductStockLogic: IProductStockLogic
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public ProductStockLogic(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ProductStockViewDto>> GetAllStocksAsync()
        {
            var stocks = await _context.ProductStocks
                .Include(ps => ps.Product)
                .Include(ps => ps.Compartment)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProductStockViewDto>>(stocks);
        }

        public async Task<IEnumerable<ProductStockViewDto>> GetStocksByProductAsync(string productId)
        {
            var stocks = await _context.ProductStocks
                .Include(ps => ps.Product)
                .Include(ps => ps.Compartment)
                .Where(ps => ps.ProductId == productId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProductStockViewDto>>(stocks);
        }

        public async Task<IEnumerable<ProductStockViewDto>> GetStocksByCompartmentAsync(string compartmentId)
        {
            var stocks = await _context.ProductStocks
                .Include(ps => ps.Product)
                .Include(ps => ps.Compartment)
                .Where(ps => ps.CompartmentId == compartmentId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProductStockViewDto>>(stocks);
        }
    }
}
