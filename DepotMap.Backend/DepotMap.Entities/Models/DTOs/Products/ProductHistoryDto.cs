using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Products
{
    public class ProductHistoryDto
    {
        public string Id { get; set; } = null!;
        public string? ProductId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int Price { get; set; }
        public string? Description { get; set; }
        public int LowStockThreshold { get; set; }
        public string ActionType { get; set; } = null!; // "Create", "Update", "Delete"
        public DateTime Timestamp { get; set; }
        public string CreatedByUserId { get; set; } = null!;

    }
}
