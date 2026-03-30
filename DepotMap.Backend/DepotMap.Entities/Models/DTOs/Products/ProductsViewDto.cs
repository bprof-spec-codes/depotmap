using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Products
{
    public class ProductsViewDto
    {
        public string Id { get; set; }
        public string Name { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int Price { get; set; }
        public int TotalStock { get; set; }
        public List<ProductStockInfoDto> ProductStocks { get; set; } = new();

    }
}
