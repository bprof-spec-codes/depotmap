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

        private List<RoutePathPointDto> BuildRoutePath(List<WarehouseCellDto> cells, List<PickingTaskDto> route)
        {
            if (cells.Count == 0 || route.Count == 0)
            {
                return new List<RoutePathPointDto>();
            }

            var passableCells = cells
                .Where(IsPassableCell)
                .Select(c => (c.X, c.Y))
                .ToHashSet();

            if (passableCells.Count == 0)
            {
                return new List<RoutePathPointDto>();
            }

            var result = new List<RoutePathPointDto>();

            var startPoint = route.First();
            var current = passableCells.Contains((startPoint.X, startPoint.Y))
                ? (startPoint.X, startPoint.Y)
                : FindNearestPassableCell(startPoint.X, startPoint.Y, passableCells);

            result.Add(new RoutePathPointDto
            {
                X = current.X,
                Y = current.Y
            });

            var pickingTargets = route
                .Where(point => point.CellType?.ToLower() != "entrance")
                .ToList();

            foreach (var target in pickingTargets)
            {
                var targetApproachCell = FindBestApproachCell(
                    target.X,
                    target.Y,
                    current,
                    passableCells
                );

                var segment = FindShortestPath(current, targetApproachCell, passableCells);

                foreach (var point in segment.Skip(1))
                {
                    result.Add(new RoutePathPointDto
                    {
                        X = point.X,
                        Y = point.Y
                    });
                }

                current = targetApproachCell;
            }

            return result;
        }

        private bool IsPassableCell(WarehouseCellDto cell)
        {
            var cellType = cell.CellType?.ToLower();

            return cellType == "corridor" || cellType == "entrance";
        }

        private (int X, int Y) FindBestApproachCell(
            int targetX,
            int targetY,
            (int X, int Y) current,
            HashSet<(int X, int Y)> passableCells)
        {
            var directions = new List<(int X, int Y)>
            {
                (0, -1),
                (1, 0),
                (0, 1),
                (-1, 0)
            };

            var candidates = directions
                .Select(d => (X: targetX + d.X, Y: targetY + d.Y))
                .Where(passableCells.Contains)
                .ToList();

            if (candidates.Count == 0)
            {
                return FindNearestPassableCell(targetX, targetY, passableCells);
            }

            return candidates
                .OrderBy(c => Math.Abs(c.X - current.X) + Math.Abs(c.Y - current.Y))
                .First();
        }

        private (int X, int Y) FindNearestPassableCell(
            int x,
            int y,
            HashSet<(int X, int Y)> passableCells)
        {
            return passableCells
                .OrderBy(c => Math.Abs(c.X - x) + Math.Abs(c.Y - y))
                .First();
        }

        private List<(int X, int Y)> FindShortestPath(
            (int X, int Y) start,
            (int X, int Y) target,
            HashSet<(int X, int Y)> passableCells)
        {
            if (start == target)
            {
                return new List<(int X, int Y)> { start };
            }

            var directions = new List<(int X, int Y)>
            {
                (0, -1),
                (1, 0),
                (0, 1),
                (-1, 0)
            };

            var queue = new Queue<(int X, int Y)>();
            var visited = new HashSet<(int X, int Y)>();
            var previous = new Dictionary<(int X, int Y), (int X, int Y)>();

            queue.Enqueue(start);
            visited.Add(start);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();

                foreach (var direction in directions)
                {
                    var next = (
                        X: current.X + direction.X,
                        Y: current.Y + direction.Y
                    );

                    if (!passableCells.Contains(next) || visited.Contains(next))
                    {
                        continue;
                    }

                    visited.Add(next);
                    previous[next] = current;

                    if (next == target)
                    {
                        return ReconstructPath(start, target, previous);
                    }

                    queue.Enqueue(next);
                }
            }

            return new List<(int X, int Y)> { start, target };
        }

        private List<(int X, int Y)> ReconstructPath(
            (int X, int Y) start,
            (int X, int Y) target,
            Dictionary<(int X, int Y), (int X, int Y)> previous)
        {
            var path = new List<(int X, int Y)> { target };
            var current = target;

            while (current != start)
            {
                current = previous[current];
                path.Add(current);
            }

            path.Reverse();

            return path;
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
        public async Task<PickingRouteMapDto> GetOrderPickingRouteMapAsync(string transactionId)
        {
            var route = await GetOrderPickingRouteAsync(transactionId);

            if (route == null || route.Count == 0)
            {
                return new PickingRouteMapDto
                {
                    Route = new List<PickingTaskDto>(),
                    RoutePath = new List<RoutePathPointDto>()
                };
            }

            var warehouseId = await _context.TransactionItems
                .Where(ti => ti.TransactionId == transactionId && ti.FromCompartmentId != null)
                .Select(ti => ti.FromCompartment!.Shelf.WarehouseCell.WarehouseId)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(warehouseId))
            {
                return new PickingRouteMapDto
                {
                    Route = route,
                    RoutePath = new List<RoutePathPointDto>()
                };
            }

            var warehouse = await _context.Warehouses
                .Include(w => w.Cells)
                .FirstOrDefaultAsync(w => w.Id == warehouseId);

            if (warehouse == null)
            {
                return new PickingRouteMapDto
                {
                    WarehouseId = warehouseId,
                    Route = route,
                    RoutePath = new List<RoutePathPointDto>()
                };
            }

            var cells = warehouse.Cells
                .OrderBy(c => c.Y)
                .ThenBy(c => c.X)
                .Select(c => new WarehouseCellDto
                {
                    Id = c.Id,
                    X = c.X,
                    Y = c.Y,
                    CellType = c.CellType
                })
                .ToList();

            return new PickingRouteMapDto
            {
                WarehouseId = warehouse.Id,
                WarehouseName = warehouse.Name,
                GridWidth = warehouse.GridWidth,
                GridHeight = warehouse.GridHeight,
                Cells = cells,
                Route = route,
                RoutePath = BuildRoutePath(cells, route)
            };
        }
    }


}
