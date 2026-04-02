using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.StockMovement
{
    public class CreateStockMovementDto
    {
        public string ProductId { get; set; } 
        public string CompartmentId { get; set; }
        public int QuantityChange { get; set; }
        public string MovementType { get; set; } 
        public string? TransactionId { get; set; }
        public string? CreatedByUserId { get; set; }
    }
}
