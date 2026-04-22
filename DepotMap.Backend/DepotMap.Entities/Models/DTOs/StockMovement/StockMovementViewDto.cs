using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.StockMovement
{
    public class StockMovementViewDto
    {
        public string Id { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string ProductSKU { get; set; } = string.Empty;
        public string CompartmentId { get; set; } = string.Empty;
        public string CompartmentCode { get; set; } = string.Empty;
        public int QuantityChange { get; set; }
        public string MovementType { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public string? CreatedByUserId { get; set; }
        public string UserIdentifier { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
