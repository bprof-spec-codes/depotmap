using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Logics;

namespace DepotMap.Tests
{
    public class WarehouseLogicTests
    {
        [Fact]
        public async Task CreateAsync_ShouldCreateWarehouseWithCells()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            var result = await logic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Test Warehouse",
                GridWidth = 3,
                GridHeight = 4
            });

            Assert.NotNull(result);
            Assert.Equal("Test Warehouse", result.Name);
            Assert.Equal(3, result.GridWidth);
            Assert.Equal(4, result.GridHeight);

            // Should generate 3x4 = 12 cells
            var detail = await logic.GetByIdAsync(result.Id);
            Assert.NotNull(detail);
            Assert.Equal(12, detail.Cells.Count);
            Assert.All(detail.Cells, c => Assert.Equal("corridor", c.CellType));
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnAllWarehouses()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            await logic.CreateAsync(new CreateWarehouseDto { Name = "W1", GridWidth = 2, GridHeight = 2 });
            await logic.CreateAsync(new CreateWarehouseDto { Name = "W2", GridWidth = 3, GridHeight = 3 });

            var result = await logic.GetAllAsync();

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnNullForInvalidId()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            var result = await logic.GetByIdAsync("nonexistent-id");

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAsync_ShouldUpdateWarehouse()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            var created = await logic.CreateAsync(new CreateWarehouseDto { Name = "Old", GridWidth = 2, GridHeight = 2 });

            var updated = await logic.UpdateAsync(created.Id, new UpdateWarehouseDto
            {
                Name = "New Name",
                GridWidth = 5,
                GridHeight = 5
            });

            Assert.NotNull(updated);
            Assert.Equal("New Name", updated.Name);
            Assert.Equal(5, updated.GridWidth);
        }

        [Fact]
        public async Task UpdateAsync_ShouldReturnNullForInvalidId()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            var result = await logic.UpdateAsync("nonexistent", new UpdateWarehouseDto { Name = "X", GridWidth = 1, GridHeight = 1 });

            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteAsync_ShouldRemoveWarehouse()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            var created = await logic.CreateAsync(new CreateWarehouseDto { Name = "ToDelete", GridWidth = 2, GridHeight = 2 });

            var deleted = await logic.DeleteAsync(created.Id);
            Assert.True(deleted);

            var all = await logic.GetAllAsync();
            Assert.Empty(all);
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnFalseForInvalidId()
        {
            using var context = TestDbHelper.CreateContext();
            var logic = new WarehouseLogic(context);

            var result = await logic.DeleteAsync("nonexistent");

            Assert.False(result);
        }
    }
}
