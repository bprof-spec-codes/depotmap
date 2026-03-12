using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
    public class Compartment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ShelfId { get; set; } = null!;
        public int LevelIndex { get; set; }
        public int SlotIndex { get; set; }
        public string Code { get; set; } = null!;  

        // Navigation
        public Shelf Shelf { get; set; } = null!;
        public ICollection<ProductStock> ProductStocks { get; set; } = new List<ProductStock>();
    }
}
