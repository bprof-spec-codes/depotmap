using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class TransactionItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        // Lehetséges értékek: "inbound", "outbound", "transfer"
        public string Type { get; set; } = null!;
        public string TransactionId { get; set; } = null!;
        public string ProductId { get; set; } = null!;
        public int Quantity { get; set; }
        public string? FromCompartmentId { get; set; }      //(Inbound esetén null)
        public string? ToCompartmentId { get; set; }        //(Outbound esetén null)

        // Navigation
        public Transaction Transaction { get; set; } = null!;
        public Product Product { get; set; } = null!;
        public Compartment? FromCompartment { get; set; }
        public Compartment? ToCompartment { get; set; }
    }
}
