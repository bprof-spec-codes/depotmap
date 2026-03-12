using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class ProductHistory
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProductId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int Price { get; set; }
        public string? Description { get; set; }
        public int LowStockThreshold { get; set; }
        // Lehetséges értékek: "edit", "delete"
        public string ActionType { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public string CreatedByUserId { get; set; } = null!;

        // Navigation
        public Product Product { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
    }
}
