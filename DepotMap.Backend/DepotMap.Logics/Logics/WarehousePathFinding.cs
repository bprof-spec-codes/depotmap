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
            if (items == null || items.Count <= 1) return items ?? new List<WarehouseCellDto>();

            var entrance = items.FirstOrDefault(c => c.CellType.ToLower() == "entrance" || c.CellType.ToLower() == "bejárat");

            var shelves = items.Where(c => c.CellType.ToLower() == "shelf_area" || c.CellType.ToLower() == "polc").ToList();

            if (!shelves.Any()) return items;

            var verticalRoute = items
            .OrderBy(c => c.X)
            .ThenBy(c => (c.X % 2 == 0) ? c.Y : int.MaxValue - c.Y)
            .ToList();

            var horizontalRoute = items
            .OrderBy(c => c.Y)
            .ThenBy(c => (c.Y % 2 == 0) ? c.X : int.MaxValue - c.X)
            .ToList();

            var startPoint = entrance ?? items.First();

            var bestShelves = CalculateTotalDistance(startPoint, verticalRoute) <= CalculateTotalDistance(startPoint, horizontalRoute)
            ? verticalRoute
            : horizontalRoute;

            var finalResult = new List<WarehouseCellDto>();
            if (entrance != null)
            {
                finalResult.Add(entrance);
            }

            finalResult.AddRange(bestShelves);
            return finalResult;
        }
        private double CalculateTotalDistance(WarehouseCellDto startNode, List<WarehouseCellDto> route)
        {
            double total = 0;
            var current = startNode;
            foreach (var next in route)
            {
                total += Math.Abs(current.X - next.X) + Math.Abs(current.Y - next.Y);
                current = next;
            }
            return total;
        }
    }


}
