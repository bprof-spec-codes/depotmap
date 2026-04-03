using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.StockMovement
{
    public class ProductStockViewDto
    {
        public string SKU { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string CompartmentCode { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
