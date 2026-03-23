using DepotMap.Data.Context;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class ProductsLogic
    {
        private readonly AppDbContext ctx;
        public ProductsLogic(AppDbContext ctx)
        {
            this.ctx = ctx;
        }
        public async Task CreateProductAsync()
    }

}
