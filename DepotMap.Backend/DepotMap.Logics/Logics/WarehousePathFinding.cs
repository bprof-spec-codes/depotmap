using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class WarehousePathFinding : IWarehousePathFinding
    {
        public List<WarehouseCellDto> GetOptimizedRoute(List<WarehouseCellDto> items)
        {
            if (items==null || items.Count <= 1) return items ?? new List<WarehouseCellDto>();
            
            var verticalRoute = items
            .OrderBy(c => c.X)
            .ThenBy(c => (c.X % 2 == 0) ? c.Y : int.MaxValue - c.Y)
            .ToList();

            var horizontalRoute = items
            .OrderBy(c => c.Y)
            .ThenBy(c => (c.Y % 2 == 0) ? c.X : int.MaxValue - c.X)
            .ToList();

            return CalculateTotalDistance(verticalRoute) <= CalculateTotalDistance(horizontalRoute)
            ? verticalRoute
            : horizontalRoute;
        }
        private double CalculateTotalDistance(List<WarehouseCellDto> route)
        {
            double total = 0;
            for (int i = 0; i < route.Count - 1; i++)
            {
                total += Math.Abs(route[i].X - route[i + 1].X) + Math.Abs(route[i].Y - route[i + 1].Y);
            }
            return total;
        }
    }


}
