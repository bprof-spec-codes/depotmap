using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class Warehouse
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = null!;
        public int GridWidth { get; set; }
        public int GridHeight { get; set; }

        // Navigation
        public ICollection<WarehouseCell> Cells { get; set; } = new List<WarehouseCell>();
    }
}
