using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class WarehouseCell
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WarehouseId { get; set; } = null!;  // FK -> Warehouse
        public int X { get; set; }
        public int Y { get; set; }
        // enumokkal szebb lenne, de doksiba string volt:
        // Lehetséges értékek: "corridor", "shelf_area", "wall", "entrance"
        public string CellType { get; set; } = null!;

        // Navigation
        public Warehouse Warehouse { get; set; } = null!;
        public ICollection<Shelf> Shelves { get; set; } = new List<Shelf>();
    }
}
