using DepotMap.Data.Context;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class WarehousePathFindingLogic : IWarehousePathFindingLogic
    {
        private readonly AppDbContext _context;

        public WarehousePathFindingLogic(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<PickingTaskDto>> GetOrderPickingRouteAsync(string transactionId)
        {
            var rawData = await _context.TransactionItems
                .Where(ti => ti.TransactionId == transactionId && ti.FromCompartmentId != null)
                .Select(ti => new
                {
                    ti.ProductId,
                    ProductName = ti.Product.Name,
                    ti.Quantity,
                    Comp = ti.FromCompartment,
                    Shelf = ti.FromCompartment.Shelf,
                    Cell = ti.FromCompartment.Shelf.WarehouseCell,
                    WarehouseId = ti.FromCompartment.Shelf.WarehouseCell.WarehouseId
                })
                .ToListAsync();

            if (!rawData.Any()) return new List<PickingTaskDto>();

            var currentWarehouseId = rawData.First().WarehouseId;

            var tasks = rawData
                .GroupBy(x => x.Shelf.Id)
                .Select(g => new PickingTaskDto
                {
                    ShelfId = g.Key,
                    ShelfCode = g.First().Shelf.Code,
                    X = g.First().Cell.X,
                    Y = g.First().Cell.Y,
                    CellType = g.First().Cell.CellType,
                    Items = g.Select(i => new CompartmentTaskDto
                    {
                        CompartmentId = i.Comp.Id,
                        CompartmentCode = i.Comp.Code,
                        LevelIndex = i.Comp.LevelIndex,
                        ProductName = i.ProductName,
                        Quantity = i.Quantity
                    }).OrderBy(i => i.LevelIndex).ToList()
                })
                .ToList();

            var entrance = await _context.WarehouseCells
                .Where(c => c.CellType == "entrance" && c.WarehouseId == currentWarehouseId)
                .FirstOrDefaultAsync();

            PickingTaskDto? entranceDto = null;
            if (entrance != null)
            {
                entranceDto = new PickingTaskDto
                {
                    X = entrance.X,
                    Y = entrance.Y,
                    CellType = entrance.CellType,
                    ShelfCode = "Entrance",
                    Items = null,
                    ShelfId = null
                };
            }
            return SortBySnake(tasks, entranceDto);
        }

        private List<PickingTaskDto> SortBySnake(List<PickingTaskDto> shelves, PickingTaskDto? entrance)
        {
            var distinctX = shelves.Select(s => s.X).Distinct().OrderBy(x => x).ToList();
            var vRoute = shelves.OrderBy(s => s.X).ThenBy(s =>
            {
                int colIdx = distinctX.IndexOf(s.X);
                return (colIdx % 2 == 0) ? s.Y : int.MaxValue - s.Y;
            }).ToList();

            var distinctY = shelves.Select(s => s.Y).Distinct().OrderBy(y => y).ToList();
            var hRoute = shelves.OrderBy(s => s.Y).ThenBy(s =>
            {
                int rowIdx = distinctY.IndexOf(s.Y);
                return (rowIdx % 2 == 0) ? s.X : int.MaxValue - s.X;
            }).ToList();

            var start = entrance ?? shelves.First();
            var bestRoute = CalculateDist(start, vRoute) <= CalculateDist(start, hRoute) ? vRoute : hRoute;

            var result = new List<PickingTaskDto>();
            if (entrance != null) result.Add(entrance);
            result.AddRange(bestRoute);

            return result;
        }

        private double CalculateDist(PickingTaskDto start, List<PickingTaskDto> route)
        {
            double d = 0;
            var curr = start;
            foreach (var next in route)
            {
                d += Math.Abs(curr.X - next.X) + Math.Abs(curr.Y - next.Y);
                curr = next;
            }
            return d;
        }
    }


}
