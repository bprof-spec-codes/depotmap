using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs
{
    public class CompartmentTaskDto
    {
        public string CompartmentId { get; set; } = null!;
        public string CompartmentCode { get; set; } = null!;
        public int LevelIndex { get; set; }
        public string ProductName { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
