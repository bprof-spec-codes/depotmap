using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Logics;

namespace DepotMap.Tests
{
    public class ShelfLogicTests
    {
        private async Task<(ShelfLogic shelfLogic, string cellId)> SetupAsync()
        {
            var context = TestDbHelper.CreateContext();
            var warehouseLogic = new WarehouseLogic(context);
            var cellLogic = new WarehouseCellLogic(context);
            var shelfLogic = new ShelfLogic(context);

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "TestWarehouse",
                GridWidth = 3,
                GridHeight = 3
            });

            // Change one cell to shelf_area
            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
            var cell = cells.First();
            await cellLogic.UpdateCellTypeAsync(cell.Id, new UpdateCellTypeDto { CellType = "shelf_area" });

            return (shelfLogic, cell.Id);
        }

        [Fact]
        public async Task CreateShelfAsync_ShouldCreateWithAutoCode()
        {
            var (shelfLogic, cellId) = await SetupAsync();

            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto
            {
                X = 0,
                Y = 0,
                Levels = 3,
                AccessibleFromBothSides = true,
                LadderRequiredFromLevel = 2
            });

            Assert.NotNull(shelf);
            Assert.Equal("A", shelf.Code);
            Assert.Equal(3, shelf.Levels);
            Assert.True(shelf.AccessibleFromBothSides);
        }

        [Fact]
        public async Task CreateShelfAsync_ShouldAutoIncrementCode()
        {
            var (shelfLogic, cellId) = await SetupAsync();

            var shelf1 = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 2 });
            var shelf2 = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 1, Y = 0, Levels = 2 });
            var shelf3 = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 2, Y = 0, Levels = 2 });

            Assert.Equal("A", shelf1.Code);
            Assert.Equal("B", shelf2.Code);
            Assert.Equal("C", shelf3.Code);
        }

        [Fact]
        public async Task GetShelvesByCellIdAsync_ShouldReturnShelves()
        {
            var (shelfLogic, cellId) = await SetupAsync();

            await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 2 });
            await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 1, Y = 0, Levels = 3 });

            var shelves = await shelfLogic.GetShelvesByCellIdAsync(cellId);

            Assert.Equal(2, shelves.Count);
        }

        [Fact]
        public async Task GetShelfDetailAsync_ShouldReturnShelfWithCompartments()
        {
            var (shelfLogic, cellId) = await SetupAsync();

            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 3 });

            var detail = await shelfLogic.GetShelfDetailAsync(shelf.Id);

            Assert.NotNull(detail);
            Assert.Equal(shelf.Code, detail.Code);
            Assert.Empty(detail.Compartments);
        }

        [Fact]
        public async Task AddCompartmentToLevelAsync_ShouldCreateCompartment()
        {
            var (shelfLogic, cellId) = await SetupAsync();
            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 3 });

            var result = await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);

            Assert.NotNull(result);
            Assert.Single(result.Compartments);
            var compartment = result.Compartments.First();
            Assert.Equal(0, compartment.LevelIndex);
            Assert.Equal(0, compartment.SlotIndex);
            Assert.Contains("A", compartment.Code); // Code should contain shelf code
        }

        [Fact]
        public async Task AddCompartmentToLevelAsync_ShouldAddMultipleSlots()
        {
            var (shelfLogic, cellId) = await SetupAsync();
            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 3 });

            await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);
            await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);
            var result = await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);

            Assert.NotNull(result);
            var level0 = result.Compartments.Where(c => c.LevelIndex == 0).ToList();
            Assert.Equal(3, level0.Count);
            Assert.Equal(0, level0[0].SlotIndex);
            Assert.Equal(1, level0[1].SlotIndex);
            Assert.Equal(2, level0[2].SlotIndex);
        }

        [Fact]
        public async Task RemoveCompartmentFromLevelAsync_ShouldRemoveLastSlot()
        {
            var (shelfLogic, cellId) = await SetupAsync();
            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 3 });

            await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);
            await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);
            var result = await shelfLogic.RemoveCompartmentFromLevelAsync(shelf.Id, 0);

            Assert.NotNull(result);
            var level0 = result.Compartments.Where(c => c.LevelIndex == 0).ToList();
            Assert.Single(level0);
        }

        [Fact]
        public async Task UpdateShelfAsync_ShouldUpdateProperties()
        {
            var (shelfLogic, cellId) = await SetupAsync();
            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto
            {
                X = 0, Y = 0, Levels = 2, AccessibleFromBothSides = false
            });

            var updated = await shelfLogic.UpdateShelfAsync(shelf.Id, new UpdateShelfDto
            {
                Levels = 5,
                AccessibleFromBothSides = true,
                LadderRequiredFromLevel = 3
            });

            Assert.NotNull(updated);
            Assert.Equal(5, updated.Levels);
            Assert.True(updated.AccessibleFromBothSides);
        }

        [Fact]
        public async Task DeleteShelfAsync_ShouldRemoveShelf()
        {
            var (shelfLogic, cellId) = await SetupAsync();
            var shelf = await shelfLogic.CreateShelfAsync(cellId, new CreateShelfDto { X = 0, Y = 0, Levels = 2 });

            var deleted = await shelfLogic.DeleteShelfAsync(shelf.Id);
            Assert.True(deleted);

            var shelves = await shelfLogic.GetShelvesByCellIdAsync(cellId);
            Assert.Empty(shelves);
        }

        [Fact]
        public async Task DeleteShelfAsync_ShouldReturnFalseForInvalidId()
        {
            var (shelfLogic, _) = await SetupAsync();

            var result = await shelfLogic.DeleteShelfAsync("nonexistent");

            Assert.False(result);
        }
    }
}
