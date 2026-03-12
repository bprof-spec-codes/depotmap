using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class StockMovement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProductId { get; set; } = null!;
        public string CompartmentId { get; set; } = null!;
        public int QuantityChange { get; set; }  // előjeles: +10 bevételezés, -2 kiadás
                                                 // Lehetséges értékek: "inbound", "outbound", "transfer", "disposal"
        public string MovementType { get; set; } = null!;
        public string? TransactionId { get; set; }
        public DateTime Timestamp { get; set; }
        public string CreatedByUserId { get; set; } = null!;

        // Navigation
        public Product Product { get; set; } = null!;
        public Compartment Compartment { get; set; } = null!;
        public Transaction? Transaction { get; set; }
        public User CreatedBy { get; set; } = null!;
    }
}
