using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Products
{
    public class InitialStockDto
    {
        public string CompartmentId { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
