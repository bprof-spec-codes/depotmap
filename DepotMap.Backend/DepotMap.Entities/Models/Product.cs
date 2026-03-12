using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class Product
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int Price { get; set; }
        public string? Description { get; set; }
        public int LowStockThreshold { get; set; }

        // Navigation
        public ICollection<ProductStock> ProductStocks { get; set; } = new List<ProductStock>();
        public ICollection<ProductHistory> History { get; set; } = new List<ProductHistory>();
    }
}
