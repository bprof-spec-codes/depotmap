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
    public class CompartmentTaskDto
    {
        public string CompartmentId { get; set; }
        public string CompartmentCode { get; set; }
        public int LevelIndex { get; set; } // CompartmentDto.LevelIndex
        public string ProductName { get; set; }
        public int Quantity { get; set; }
    }
    public class PickingTaskDto
    {
        public string ShelfId { get; set; }
        public string ShelfCode { get; set; }
        // Koordináták a te DTO-idból
        public int CellX { get; set; }  // WarehouseCellDto.X
        public int CellY { get; set; }  // WarehouseCellDto.Y
        public int ShelfX { get; set; } // ShelfListDto.X
        public int ShelfY { get; set; } // ShelfListDto.Y
        public string CellType { get; set; }

        // A termékek, amiket ennél a szekrénynél kell fogni
        public List<CompartmentTaskDto> Items { get; set; } = new();
    }

    public class WarehousePathFindingLogic : IWarehousePathFinding
    {
        private readonly AppDbContext _context;

        public WarehousePathFindingLogic(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<PickingTaskDto>> GetOrderPickingRouteAsync(string transactionId)
        {
            // 1. Adatbázis lekérdezés a TransactionItems-ből
            // Itt a 'FromCompartment' az induló polc, mert kiadási tranzakciót (picking) feltételezünk
            var rawData = await _context.TransactionItems
                .Where(ti => ti.TransactionId == transactionId)
                .Select(ti => new
                {
                    ProductId = ti.ProductId,
                    ProductName = ti.Product.Name,
                    Quantity = ti.Quantity,
                    Comp = ti.FromCompartment,
                    Shelf = ti.FromCompartment.Shelf,
                    Cell = ti.FromCompartment.Shelf.WarehouseCell
                })
                .ToListAsync();

            if (!rawData.Any()) return new List<PickingTaskDto>();

            // 2. Csoportosítás szekrényenként
            var tasks = rawData
                .GroupBy(x => x.Shelf.Id)
                .Select(g => new PickingTaskDto
                {
                    ShelfId = g.Key,
                    ShelfCode = g.First().Shelf.Code,
                    CellX = g.First().Cell.X,
                    CellY = g.First().Cell.Y,
                    ShelfX = g.First().Shelf.X,
                    ShelfY = g.First().Shelf.Y,
                    CellType = g.First().Cell.CellType,
                    Items = g.Select(i => new CompartmentTaskDto
                    {
                        CompartmentId = i.Comp.Id,
                        CompartmentCode = i.Comp.Code,
                        LevelIndex = i.Comp.LevelIndex,
                        ProductName = i.ProductName,
                        Quantity = i.Quantity
                    }).ToList()
                })
                .ToList();

            // 3. Bejárat keresése
            var entrance = await _context.WarehouseCells
                .Where(c => c.CellType == "entrance")
                .Select(c => new PickingTaskDto
                {
                    CellX = c.X,
                    CellY = c.Y,
                    CellType = "entrance",
                    ShelfCode = "BEJÁRAT"
                })
                .FirstOrDefaultAsync();

            // 4. Kettős Snake rendezés
            return SortBySnake(tasks, entrance);
        }

        private List<PickingTaskDto> SortBySnake(List<PickingTaskDto> shelves, PickingTaskDto entrance)
        {
            // Függőleges (V) irányú bejárás
            var vRoute = shelves
                .OrderBy(t => t.CellX)
                .ThenBy(t => (t.CellX % 2 == 0) ? t.CellY : int.MaxValue - t.CellY)
                .ThenBy(t => t.ShelfX)
                .ThenBy(t => (t.ShelfX % 2 == 0) ? t.ShelfY : int.MaxValue - t.ShelfY)
                .ToList();

            // Vízszintes (H) irányú bejárás
            var hRoute = shelves
                .OrderBy(t => t.CellY)
                .ThenBy(t => (t.CellY % 2 == 0) ? t.CellX : int.MaxValue - t.CellX)
                .ThenBy(t => t.ShelfY)
                .ThenBy(t => (t.ShelfY % 2 == 0) ? t.ShelfX : int.MaxValue - t.ShelfX)
                .ToList();

            var start = entrance ?? (shelves.Any() ? shelves.First() : null);
            if (start == null) return shelves;

            // Kiválasztjuk a rövidebbet
            var best = CalculateDist(start, vRoute) <= CalculateDist(start, hRoute) ? vRoute : hRoute;

            var result = new List<PickingTaskDto>();
            if (entrance != null) result.Add(entrance);

            foreach (var task in best)
            {
                // Szekrényen belül szintek szerint rendezünk (lentről felfelé)
                task.Items = task.Items.OrderBy(i => i.LevelIndex).ToList();
                result.Add(task);
            }
            return result;
        }

        private double CalculateDist(PickingTaskDto start, List<PickingTaskDto> route)
        {
            double d = 0;
            var curr = start;
            foreach (var next in route)
            {
                // Manhattan távolság a nagy rácson és a belső rácson is
                d += Math.Abs(curr.CellX - next.CellX) + Math.Abs(curr.CellY - next.CellY);
                d += Math.Abs(curr.ShelfX - next.ShelfX) + Math.Abs(curr.ShelfY - next.ShelfY);
                curr = next;
            }
            return d;
        }
    }


}
