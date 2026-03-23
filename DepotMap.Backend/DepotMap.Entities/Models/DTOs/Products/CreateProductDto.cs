using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Products
{
    public class CreateProductDto
    {
        public string Name { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int Price { get; set; }

        public string Description { get; set; } = null!;
        public int LowStockThreshold { get; set; }
        public List<InitialStockDto> Stocks { get; set; } = new List<InitialStockDto>();


    }
}
