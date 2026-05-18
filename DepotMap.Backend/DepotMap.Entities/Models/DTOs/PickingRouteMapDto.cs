using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs
{
    public class PickingRouteMapDto
    {
        public string WarehouseId { get; set; } = string.Empty;

        public string WarehouseName { get; set; } = string.Empty;

        public int GridWidth { get; set; }

        public int GridHeight { get; set; }

        public List<WarehouseCellDto> Cells { get; set; } = new();

        public List<PickingTaskDto> Route { get; set; } = new();
        public List<RoutePathPointDto> RoutePath { get; set; } = new();
    }
    public class RoutePathPointDto
    {
        public int X { get; set; }

        public int Y { get; set; }
    }
}
