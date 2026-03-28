using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Logics;

namespace DepotMap.Tests
{
    public class WarehouseWorkflowTests
    {
        private (WarehouseLogic warehouseLogic, WarehouseCellLogic cellLogic, ShelfLogic shelfLogic) CreateServices()
        {
            var context = TestDbHelper.CreateContext();
            return (new WarehouseLogic(context), new WarehouseCellLogic(context), new ShelfLogic(context));
        }

        [Fact]
        public async Task CreateWarehouse_ThenGetCells_ShouldReturnMatchingGrid()
        {
            var (warehouseLogic, cellLogic, _) = CreateServices();

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Workflow Test",
                GridWidth = 4,
                GridHeight = 3
            });

            // A warehouse ID-t használjuk a cellák lekéréséhez
            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);

            Assert.Equal(warehouse.GridWidth * warehouse.GridHeight, cells.Count);
            // Ellenőrizzük hogy minden X,Y koordináta megvan
            for (int x = 0; x < warehouse.GridWidth; x++)
            {
                for (int y = 0; y < warehouse.GridHeight; y++)
                {
                    Assert.Single(cells, c => c.X == x && c.Y == y);
                }
            }
        }

        [Fact]
        public async Task CreateWarehouse_GetById_CellIds_ShouldMatchCellLogicIds()
        {
            var (warehouseLogic, cellLogic, _) = CreateServices();

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "ID Match Test",
                GridWidth = 2,
                GridHeight = 2
            });

            // Két különböző úton kérjük le a cellákat
            var detailDto = await warehouseLogic.GetByIdAsync(warehouse.Id);
            var cellsFromCellLogic = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);

            Assert.NotNull(detailDto);
            // Ugyanazokat az ID-kat kell kapnunk mindkét útvonalon
            var idsFromDetail = detailDto.Cells.Select(c => c.Id).OrderBy(id => id).ToList();
            var idsFromCellLogic = cellsFromCellLogic.Select(c => c.Id).OrderBy(id => id).ToList();

            Assert.Equal(idsFromDetail, idsFromCellLogic);
        }

        [Fact]
        public async Task CreateWarehouse_UpdateCell_ThenGetDetail_ShouldReflectChange()
        {
            var (warehouseLogic, cellLogic, _) = CreateServices();

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Cell Update Flow",
                GridWidth = 3,
                GridHeight = 3
            });

            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
            var targetCell = cells.First(c => c.X == 1 && c.Y == 1);

            // Típusváltás a cellLogic-on keresztül
            await cellLogic.UpdateCellTypeAsync(targetCell.Id, new UpdateCellTypeDto { CellType = "shelf_area" });

            // Ellenőrzés: a warehouse detail-ben is tükröződik
            var warehouseDetail = await warehouseLogic.GetByIdAsync(warehouse.Id);
            Assert.NotNull(warehouseDetail);
            var updatedCell = warehouseDetail.Cells.First(c => c.Id == targetCell.Id);
            Assert.Equal("shelf_area", updatedCell.CellType);
        }

        [Fact]
        public async Task FullWorkflow_CreateWarehouse_SetupCell_AddShelf_AddCompartment()
        {
            var (warehouseLogic, cellLogic, shelfLogic) = CreateServices();

            // 1. Raktár létrehozása
            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Full Workflow",
                GridWidth = 3,
                GridHeight = 3
            });

            // 2. Cellák lekérése a warehouse ID-val
            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
            Assert.Equal(9, cells.Count);

            // 3. Egy cellát shelf_area-ra állítunk
            var targetCell = cells.First(c => c.X == 0 && c.Y == 0);
            var updatedCell = await cellLogic.UpdateCellTypeAsync(targetCell.Id, new UpdateCellTypeDto { CellType = "shelf_area" });
            Assert.NotNull(updatedCell);
            Assert.Equal("shelf_area", updatedCell.CellType);

            // 4. Polc létrehozása a cella ID-jával
            var shelf = await shelfLogic.CreateShelfAsync(targetCell.Id, new CreateShelfDto
            {
                X = 0,
                Y = 0,
                Levels = 3,
                AccessibleFromBothSides = true
            });
            Assert.NotNull(shelf);
            Assert.Equal("A", shelf.Code);

            // 5. Rekesz hozzáadása a polc ID-jával
            var shelfDetail = await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);
            Assert.NotNull(shelfDetail);
            Assert.Single(shelfDetail.Compartments);
            Assert.Equal(0, shelfDetail.Compartments.First().LevelIndex);

            // 6. Visszaellenőrzés: a cella detail-ben megjelenik a polc
            var cellDetail = await cellLogic.GetCellDetailAsync(targetCell.Id);
            Assert.NotNull(cellDetail);
            Assert.Single(cellDetail.Shelves);
            Assert.Equal(shelf.Id, cellDetail.Shelves.First().Id);
        }

        [Fact]
        public async Task BatchUpdateCells_ThenCreateShelves_ShouldWorkWithReturnedIds()
        {
            var (warehouseLogic, cellLogic, shelfLogic) = CreateServices();

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Batch Flow",
                GridWidth = 3,
                GridHeight = 3
            });

            // Batch update-tel több cellát shelf_area-ra állítunk
            var updatedCells = await cellLogic.BatchUpdateCellsAsync(warehouse.Id, new BatchUpdateCellsDto
            {
                Cells = new List<CellUpdateItem>
                {
                    new() { X = 0, Y = 0, CellType = "shelf_area" },
                    new() { X = 1, Y = 0, CellType = "shelf_area" },
                    new() { X = 0, Y = 1, CellType = "entrance" }
                }
            });

            var shelfAreaCells = updatedCells.Where(c => c.CellType == "shelf_area").ToList();
            Assert.Equal(2, shelfAreaCells.Count);

            // A visszakapott ID-kkal polcokat hozunk létre
            foreach (var cell in shelfAreaCells)
            {
                var shelf = await shelfLogic.CreateShelfAsync(cell.Id, new CreateShelfDto
                {
                    X = 0,
                    Y = 0,
                    Levels = 2,
                    AccessibleFromBothSides = false
                });
                Assert.NotNull(shelf);
            }

            // Ellenőrzés: mindkét cellában van polc
            foreach (var cell in shelfAreaCells)
            {
                var shelves = await shelfLogic.GetShelvesByCellIdAsync(cell.Id);
                Assert.Single(shelves);
            }
        }

        [Fact]
        public async Task MultipleShelvesWithCompartments_CodesShouldBeConsistent()
        {
            var (warehouseLogic, cellLogic, shelfLogic) = CreateServices();

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Test Warehouse",
                GridWidth = 2,
                GridHeight = 2
            });

            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
            var cell = cells.First();
            await cellLogic.UpdateCellTypeAsync(cell.Id, new UpdateCellTypeDto { CellType = "shelf_area" });

            // 2 polcot hozunk létre
            var shelfA = await shelfLogic.CreateShelfAsync(cell.Id, new CreateShelfDto { X = 0, Y = 0, Levels = 2 });
            var shelfB = await shelfLogic.CreateShelfAsync(cell.Id, new CreateShelfDto { X = 1, Y = 0, Levels = 2 });

            Assert.Equal("A", shelfA.Code);
            Assert.Equal("B", shelfB.Code);

            // Rekeszeket adunk mindkét polchoz
            var detailA = await shelfLogic.AddCompartmentToLevelAsync(shelfA.Id, 0);
            var detailB = await shelfLogic.AddCompartmentToLevelAsync(shelfB.Id, 0);

            Assert.NotNull(detailA);
            Assert.NotNull(detailB);

            // A rekesz kódok tartalmazzák a polc kódját
            Assert.Contains("A", detailA.Compartments.First().Code);
            Assert.Contains("B", detailB.Compartments.First().Code);

            // A két rekesz kódja különböző
            Assert.NotEqual(
                detailA.Compartments.First().Code,
                detailB.Compartments.First().Code
            );
        }

        [Fact]
        public async Task DeleteWarehouse_ShouldCascadeToAllChildren()
        {
            var (warehouseLogic, cellLogic, shelfLogic) = CreateServices();

            var warehouse = await warehouseLogic.CreateAsync(new CreateWarehouseDto
            {
                Name = "Delete Cascade",
                GridWidth = 2,
                GridHeight = 2
            });

            var cells = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
            var cell = cells.First();
            await cellLogic.UpdateCellTypeAsync(cell.Id, new UpdateCellTypeDto { CellType = "shelf_area" });

            var shelf = await shelfLogic.CreateShelfAsync(cell.Id, new CreateShelfDto { X = 0, Y = 0, Levels = 2 });
            await shelfLogic.AddCompartmentToLevelAsync(shelf.Id, 0);

            // Raktár törlése
            var deleted = await warehouseLogic.DeleteAsync(warehouse.Id);
            Assert.True(deleted);

            // Minden gyerek eltűnt
            var cellsAfter = await cellLogic.GetCellsByWarehouseIdAsync(warehouse.Id);
            Assert.Empty(cellsAfter);

            var shelfDetail = await shelfLogic.GetShelfDetailAsync(shelf.Id);
            Assert.Null(shelfDetail);
        }
    }
}
