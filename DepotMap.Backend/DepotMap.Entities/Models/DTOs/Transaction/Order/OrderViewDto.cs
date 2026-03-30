using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Order
{
    public class OrderViewDto
    {
        public string Id { get; set; }
        public string Status { get; set; }
        public string Type { get; set; }
        public DateTime Timestamp { get; set; }
        public string CreatedByUserId { get; set; }
        public List<OrderItemViewDto> Items { get; set; }
    }
}
