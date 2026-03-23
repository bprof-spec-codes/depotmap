using AutoMapper;
using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Products;
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
        public ProductsLogic(AppDbContext ctx , IMapper mapper) 
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

    }

}
