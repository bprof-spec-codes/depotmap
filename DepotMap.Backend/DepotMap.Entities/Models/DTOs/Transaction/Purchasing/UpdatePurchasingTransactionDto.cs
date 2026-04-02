using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Purchasing
{
    public class UpdatePurchasingTransactionDto
    {
        public List<CreatePurchasingTransactionItemDto>? Items { get; set; }
        public string? Status { get; set; }
    }
}
