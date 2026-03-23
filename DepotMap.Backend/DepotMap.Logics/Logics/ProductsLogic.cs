using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Products;
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
            var product = _mapper.Map<Product>(dto);
            _ctx.Products.Add(product);
            await _ctx.SaveChangesAsync();
        }
        public async Task UpdateProductAsync(string id, CreateProductDto dto, string userId)
        {

            var product = await _ctx.Products.FindAsync(id);
            if (product == null) throw new Exception("Product not found");
            var history = _mapper.Map<ProductHistory>(product);

            history.ActionType = "edit";
            history.Timestamp = DateTime.Now;
            history.CreatedByUserId = userId;

            _ctx.ProductHistories.Add(history);


            _mapper.Map(dto, product);

            await _ctx.SaveChangesAsync();
        }
        public async Task DeleteProductAsync(string id, string userId)
        {
           
            var product = await _ctx.Products.FindAsync(id);
            if (product == null) throw new Exception("Product not found");
           
            var historyEntry = _mapper.Map<ProductHistory>(product);

            historyEntry.ActionType = "delete"; 
            historyEntry.Timestamp = DateTime.Now;
            historyEntry.CreatedByUserId = userId;

            _ctx.ProductHistories.Add(historyEntry);

            _ctx.Products.Remove(product);

            await _ctx.SaveChangesAsync();
        }
    }

}
