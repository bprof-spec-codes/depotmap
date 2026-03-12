using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class ProductStock
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProductId { get; set; } = null!;
        public string CompartmentId { get; set; } = null!;
        public int Quantity { get; set; }

        // Navigation
        public Product Product { get; set; } = null!;
        public Compartment Compartment { get; set; } = null!;
    }
}
