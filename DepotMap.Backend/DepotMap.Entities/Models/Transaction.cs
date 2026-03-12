using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class Transaction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        // Lehetséges értékek: "inbound", "outbound", "transfer", "disposal"
        public string Type { get; set; } = null!;
        // Lehetséges értékek: "planning", "active", "closed"
        public string Status { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public string CreatedByUserId { get; set; } = null!;

        // Navigation
        public User CreatedBy { get; set; } = null!;
        public ICollection<TransactionItem> Items { get; set; } = new List<TransactionItem>();
        public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    }
}
