using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs
{
    public class CreatePurchaseItemDto
    {
        public string ProductId { get; set; } = null!;
        public string ToCompartmentId { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
