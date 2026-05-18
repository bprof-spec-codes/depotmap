using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Products;
using DepotMap.Logics.Helpers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class ProductsLogic
    {
        private readonly AppDbContext _ctx;
        private readonly IMapper _mapper;
        public ProductsLogic(AppDbContext ctx, IMapper mapper)
        {
            this._ctx = ctx;
            _mapper = mapper;
        }
        public async Task CreateProductAsync(CreateProductDto dto)
        {
            if (dto == null)
            {
                throw new BadRequestException("Hiányzó termékadatok.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new BadRequestException("A termék neve kötelező.");
            }

            if (string.IsNullOrWhiteSpace(dto.SKU))
            {
                throw new BadRequestException("A cikkszám megadása kötelező.");
            }

            if (dto.InitialStocks == null || dto.InitialStocks.Count == 0)
            {
                throw new BadRequestException("Adj meg legalább egy tárolóhelyet a termékhez.");
            }

            if (dto.InitialStocks.Any(stock => string.IsNullOrWhiteSpace(stock.CompartmentId)))
            {
                throw new BadRequestException("Minden tárolóhelyhez kötelező az azonosító.");
            }

            var normalizedSku = dto.SKU.Trim();
            var skuExists = await _ctx.Products
                .AnyAsync(p => p.SKU == normalizedSku);
            if (skuExists)
            {
                throw new ConflictException($"Már létezik termék ezzel a cikkszámmal: {normalizedSku}");
            }

            var desiredCompartmentIds = dto.InitialStocks
                .Where(stock => !string.IsNullOrWhiteSpace(stock.CompartmentId))
                .Select(stock => stock.CompartmentId)
                .Distinct()
                .ToList();

            var compartments = await _ctx.Compartments
                .Where(c => desiredCompartmentIds.Contains(c.Id))
                .Select(c => new { c.Id, c.Code })
                .ToListAsync();

            if (compartments.Count != desiredCompartmentIds.Count)
            {
                var existingIds = compartments.Select(c => c.Id).ToHashSet();
                var missingIds = desiredCompartmentIds.Where(id => !existingIds.Contains(id)).ToList();
                throw new NotFoundException($"Nem található tárolóhely azonosító: {string.Join(", ", missingIds)}");
            }

            var occupiedStocks = await _ctx.ProductStocks
                .Include(ps => ps.Compartment)
                .Where(ps => desiredCompartmentIds.Contains(ps.CompartmentId))
                .ToListAsync();

            if (occupiedStocks.Any())
            {
                var occupiedCodes = occupiedStocks
                    .Select(ps => ps.Compartment?.Code ?? ps.CompartmentId)
                    .Distinct()
                    .OrderBy(code => code)
                    .ToList();
                throw new ConflictException($"A kiválasztott tárolóhely(ek) már foglaltak: {string.Join(", ", occupiedCodes)}");
            }

            var product = _mapper.Map<Product>(dto);
            product.SKU = normalizedSku;
            product.Name = dto.Name.Trim();
            product.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

            _ctx.Products.Add(product);
            await _ctx.SaveChangesAsync();

            await SyncInitialStocksAsync(product.Id, dto.InitialStocks);
        }
        public async Task<List<ProductsViewDto>> GetAllProductsAsync()
        {
            var products = await _ctx.Products
                .Include(p => p.ProductStocks)
                    .ThenInclude(ps => ps.Compartment)
                .ToListAsync();

            return products.Select(MapToViewDto).ToList();
        }

        public async Task<ProductsViewDto?> GetProductByIdAsync(string id)
        {
            var product = await _ctx.Products
                .Include(p => p.ProductStocks)
                    .ThenInclude(ps => ps.Compartment)
                .FirstOrDefaultAsync(p => p.Id == id);

            return product == null ? null : MapToViewDto(product);
        }
        public async Task UpdateProductAsync(string id, CreateProductDto dto, string userId)
        {
            if (dto == null)
            {
                throw new BadRequestException("Hiányzó termékadatok.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                throw new BadRequestException("A termék neve kötelező.");
            }

            if (string.IsNullOrWhiteSpace(dto.SKU))
            {
                throw new BadRequestException("A cikkszám megadása kötelező.");
            }

            if (dto.InitialStocks == null || dto.InitialStocks.Count == 0)
            {
                throw new BadRequestException("Adj meg legalább egy tárolóhelyet a termékhez.");
            }

            if (dto.InitialStocks.Any(stock => string.IsNullOrWhiteSpace(stock.CompartmentId)))
            {
                throw new BadRequestException("Minden tárolóhelyhez kötelező az azonosító.");
            }

            var product = await _ctx.Products
                .Include(p => p.ProductStocks)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null)
            {
                throw new NotFoundException("A termék nem található.");
            }

            var normalizedSku = dto.SKU.Trim();
            var skuExists = await _ctx.Products
                .AnyAsync(p => p.SKU == normalizedSku && p.Id != id);
            if (skuExists)
            {
                throw new ConflictException($"Már létezik másik termék ezzel a cikkszámmal: {normalizedSku}");
            }

            var desiredCompartmentIds = dto.InitialStocks
                .Where(stock => !string.IsNullOrWhiteSpace(stock.CompartmentId))
                .Select(stock => stock.CompartmentId)
                .Distinct()
                .ToList();

            var compartments = await _ctx.Compartments
                .Where(c => desiredCompartmentIds.Contains(c.Id))
                .Select(c => new { c.Id, c.Code })
                .ToListAsync();

            if (compartments.Count != desiredCompartmentIds.Count)
            {
                var existingIds = compartments.Select(c => c.Id).ToHashSet();
                var missingIds = desiredCompartmentIds.Where(compartmentId => !existingIds.Contains(compartmentId)).ToList();
                throw new NotFoundException($"Nem található tárolóhely azonosító: {string.Join(", ", missingIds)}");
            }

            var occupiedStocks = await _ctx.ProductStocks
                .Include(ps => ps.Compartment)
                .Where(ps => desiredCompartmentIds.Contains(ps.CompartmentId) && ps.ProductId != id)
                .ToListAsync();

            if (occupiedStocks.Any())
            {
                var occupiedCodes = occupiedStocks
                    .Select(ps => ps.Compartment?.Code ?? ps.CompartmentId)
                    .Distinct()
                    .OrderBy(code => code)
                    .ToList();
                throw new ConflictException($"A kiválasztott tárolóhely(ek) már foglaltak: {string.Join(", ", occupiedCodes)}");
            }

            var history = _mapper.Map<ProductHistory>(product);

            history.ActionType = "edit";
            history.Timestamp = DateTime.Now;
            history.CreatedByUserId = userId;

            _ctx.ProductHistories.Add(history);


            _mapper.Map(dto, product);
            product.SKU = normalizedSku;
            product.Name = dto.Name.Trim();
            product.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();

            await _ctx.SaveChangesAsync();

            await SyncInitialStocksAsync(product.Id, dto.InitialStocks);
        }
        public async Task DeleteProductAsync(string id, string userId)
        {
            var product = await _ctx.Products.FindAsync(id);
            if (product == null)
            {
                throw new NotFoundException("A termék nem található.");
            }

            var hasStock = await _ctx.ProductStocks
                .AnyAsync(ps => ps.ProductId == id && ps.Quantity > 0);
            if (hasStock)
            {
                throw new BadRequestException("A termék készleten van. Törlés előtt ürítsd ki a készletet.");
            }

            var historyEntry = _mapper.Map<ProductHistory>(product);

            historyEntry.ActionType = "delete";
            historyEntry.Timestamp = DateTime.Now;
            historyEntry.CreatedByUserId = userId;

            
            historyEntry.ProductId = null;

            _ctx.ProductHistories.Add(historyEntry);
            _ctx.Products.Remove(product);

            await _ctx.SaveChangesAsync();
        }

        private async Task SyncInitialStocksAsync(string productId, List<InitialStockDto> initialStocks)
        {
            var desiredCompartmentIds = initialStocks
                .Where(stock => !string.IsNullOrWhiteSpace(stock.CompartmentId))
                .Select(stock => stock.CompartmentId)
                .Distinct()
                .ToList();

            if (desiredCompartmentIds.Count == 0)
            {
                var removableStocks = await _ctx.ProductStocks
                    .Where(ps => ps.ProductId == productId && ps.Quantity == 0)
                    .ToListAsync();

                _ctx.ProductStocks.RemoveRange(removableStocks);
                await _ctx.SaveChangesAsync();
                return;
            }

            var existingStocks = await _ctx.ProductStocks
                .Where(ps => ps.ProductId == productId)
                .ToListAsync();

            foreach (var stock in existingStocks)
            {
                if (stock.Quantity == 0 && !desiredCompartmentIds.Contains(stock.CompartmentId))
                {
                    _ctx.ProductStocks.Remove(stock);
                }
            }

            var existingCompartmentIds = existingStocks.Select(ps => ps.CompartmentId).ToHashSet();

            foreach (var compartmentId in desiredCompartmentIds)
            {
                if (existingCompartmentIds.Contains(compartmentId))
                {
                    continue;
                }

                _ctx.ProductStocks.Add(new ProductStock
                {
                    ProductId = productId,
                    CompartmentId = compartmentId,
                    Quantity = 0
                });
            }

            await _ctx.SaveChangesAsync();
        }

        private static ProductsViewDto MapToViewDto(Product product)
        {
            return new ProductsViewDto
            {
                Id = product.Id,
                Name = product.Name,
                SKU = product.SKU,
                Price = product.Price,
                Description = product.Description,
                LowStockThreshold = product.LowStockThreshold,
                TotalStock = product.ProductStocks.Sum(ps => ps.Quantity),
                ProductStocks = product.ProductStocks.Select(ps => new ProductStockInfoDto
                {
                    ProductId = ps.ProductId,
                    ProductName = ps.Product?.Name ?? product.Name,
                    SKU = ps.Product?.SKU ?? product.SKU,
                    CompartmentId = ps.CompartmentId,
                    Quantity = ps.Quantity
                }).ToList()
            };
        }

        public async Task<List<ProductHistoryDto>> GetProductHistoryAsync(string? productId = null)
        {
            var query = _ctx.ProductHistories.AsQueryable();

            if (!string.IsNullOrEmpty(productId))
            {
                query = query.Where(h => h.ProductId == productId);
            }

            var histories = await query
                .OrderByDescending(h => h.Timestamp)
                .ToListAsync();

            return _mapper.Map<List<ProductHistoryDto>>(histories);
        }
    }

}
