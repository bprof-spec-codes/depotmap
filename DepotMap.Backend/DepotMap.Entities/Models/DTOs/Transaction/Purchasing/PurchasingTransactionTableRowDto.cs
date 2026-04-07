using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Purchasing
{
    public class PurchasingTransactionTableRowDto
    {
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string ProductId { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
