using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Logics;

namespace DepotMap.Tests
{
    public class WarehouseCellLogicTests
    {
        private async Task<(WarehouseLogic warehouseLogic, WarehouseCellLogic cellLogic, string warehouseId)> SetupAsync()
        {
            var context = TestDbHelper.CreateContext();
            var warehouseLogic = new WarehouseLogic(context);
            var cellLogic = new WarehouseCellLogic(context);

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Test",
                GridWidth = 3,
                GridHeight = 3
            });

            return (warehouseLogic, cellLogic, warehouse.Id);
        }

        [Fact]
        public async Task GetCellsByWarehouseIdAsync_ShouldReturnAllCells()
        {
            var (_, cellLogic, warehouseId) = await SetupAsync();

            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouseId);

            Assert.Equal(9, cells.Count);
            Assert.All(cells, c => Assert.Equal("corridor", c.CellType));
        }

        [Fact]
        public async Task GetCellDetailAsync_ShouldReturnCellWithEmptyShelves()
        {
            var (_, cellLogic, warehouseId) = await SetupAsync();
            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouseId);
            var firstCellId = cells.First().Id;

            var detail = await cellLogic.GetCellDetailAsync(firstCellId);

            Assert.NotNull(detail);
            Assert.Empty(detail.Shelves);
        }

        [Fact]
        public async Task GetCellDetailAsync_ShouldReturnNullForInvalidId()
        {
            var (_, cellLogic, _) = await SetupAsync();

            var result = await cellLogic.GetCellDetailAsync("nonexistent");

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateCellTypeAsync_ShouldChangeCellType()
        {
            var (_, cellLogic, warehouseId) = await SetupAsync();
            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouseId);
            var cellId = cells.First().Id;

            var updated = await cellLogic.UpdateCellTypeAsync(cellId, new UpdateCellTypeDto { CellType = "shelf_area" });

            Assert.NotNull(updated);
            Assert.Equal("shelf_area", updated.CellType);
        }

        [Fact]
        public async Task UpdateCellTypeAsync_ShouldReturnNullForInvalidId()
        {
            var (_, cellLogic, _) = await SetupAsync();

            var result = await cellLogic.UpdateCellTypeAsync("nonexistent", new UpdateCellTypeDto { CellType = "wall" });

            Assert.Null(result);
        }

        [Fact]
        public async Task BatchUpdateCellsAsync_ShouldUpdateMultipleCells()
        {
            var (_, cellLogic, warehouseId) = await SetupAsync();

            var result = await cellLogic.BatchUpdateCellsAsync(warehouseId, new BatchUpdateCellsDto
            {
                Cells = new List<CellUpdateItem>
                {
                    new() { X = 0, Y = 0, CellType = "entrance" },
                    new() { X = 1, Y = 1, CellType = "shelf_area" },
                    new() { X = 2, Y = 2, CellType = "wall" }
                }
            });

            Assert.Equal(9, result.Count);
            Assert.Single(result, c => c.CellType == "entrance");
            Assert.Single(result, c => c.CellType == "shelf_area");
            Assert.Single(result, c => c.CellType == "wall");
            Assert.Equal(6, result.Count(c => c.CellType == "corridor"));
        }
    }
}
