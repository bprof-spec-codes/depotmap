using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Order
{
    public class OrderItemViewDto
    {
        public string ProductSKU { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string FromCompartmentCode { get; set; } = string.Empty;
    }
}
