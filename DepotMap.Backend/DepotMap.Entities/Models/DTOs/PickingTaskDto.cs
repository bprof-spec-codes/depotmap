using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs
{
    public class PickingTaskDto
    {
        public string? ShelfId { get; set; }
        public string ShelfCode { get; set; } = null!;
        public int X { get; set; }
        public int Y { get; set; }
        public string CellType { get; set; } = null!;
        public List<CompartmentTaskDto>? Items { get; set; }
    }
}
