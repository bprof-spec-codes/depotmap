using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class Shelf
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WarehouseCellId { get; set; } = null!;
        public int X { get; set; }
        public int Y { get; set; }
        public int Levels { get; set; }
        public bool AccessibleFromBothSides { get; set; }
        public int? LadderRequiredFromLevel { get; set; }
        public string Code { get; set; } = null!;

        // Navigation
        public WarehouseCell WarehouseCell { get; set; } = null!;
        public ICollection<Compartment> Compartments { get; set; } = new List<Compartment>();
    }
}
