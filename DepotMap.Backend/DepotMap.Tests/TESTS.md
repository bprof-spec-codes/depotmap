# DepotMap Backend — Unit Teszt Dokumentáció

## Áttekintés

Ez a dokumentáció a **DepotMap** raktárkezelő webalkalmazás backend unit tesztjeit írja le. A tesztek a service réteg (üzleti logika) helyes működését ellenőrzik.

- **Teszt framework**: xUnit
- **Adatbázis**: Entity Framework Core InMemory provider
- **Tesztek száma**: 23 (mind PASSED)

## Tesztek futtatása

```bash
cd DepotMap.Backend
dotnet test DepotMap.Tests
```

## TestDbHelper

A `TestDbHelper` segédosztály minden teszthez egyedi InMemory adatbázist hoz létre egy véletlenszerű GUID-alapú névvel. Ez biztosítja, hogy a tesztek teljesen izoláltak egymástól — egyik teszt sem befolyásolja a másik állapotát, és párhuzamosan is futtathatók.

---

## Tesztosztályok

### 1. WarehouseLogicTests (7 teszt)

A `WarehouseLogic` service raktárak CRUD műveleteit teszteli. Fontos viselkedés: raktár létrehozásakor automatikusan generálódik `GridWidth × GridHeight` darab cella "corridor" típussal.

| Teszt | Leírás |
|-------|--------|
| `CreateAsync_ShouldCreateWarehouseWithCells` | Raktár létrehozása és ellenőrzés, hogy a 3×4 = 12 cella automatikusan generálódott corridor típussal |
| `GetAllAsync_ShouldReturnAllWarehouses` | Több raktár létrehozása után az összes listázása |
| `GetByIdAsync_ShouldReturnNullForInvalidId` | Nem létező ID lekérdezése null-t ad vissza |
| `UpdateAsync_ShouldUpdateWarehouse` | Raktár nevének és méretének frissítése |
| `UpdateAsync_ShouldReturnNullForInvalidId` | Nem létező raktár frissítése null-t ad vissza |
| `DeleteAsync_ShouldRemoveWarehouse` | Raktár törlése, majd ellenőrzés, hogy valóban eltűnt |
| `DeleteAsync_ShouldReturnFalseForInvalidId` | Nem létező raktár törlése false-t ad vissza |

### 2. WarehouseCellLogicTests (6 teszt)

A `WarehouseCellLogic` service raktárcellák kezelését teszteli (típusváltás, batch update). A setup létrehoz egy 3×3-as raktárat (9 cella).

| Teszt | Leírás |
|-------|--------|
| `GetCellsByWarehouseIdAsync_ShouldReturnAllCells` | 3×3 raktár → 9 cella visszaadása, mind corridor típussal |
| `GetCellDetailAsync_ShouldReturnCellWithEmptyShelves` | Cella részleteinek lekérése üres polc listával |
| `GetCellDetailAsync_ShouldReturnNullForInvalidId` | Nem létező cella lekérdezése null-t ad vissza |
| `UpdateCellTypeAsync_ShouldChangeCellType` | Cella típusának módosítása corridor → shelf_area |
| `UpdateCellTypeAsync_ShouldReturnNullForInvalidId` | Nem létező cella típusváltása null-t ad vissza |
| `BatchUpdateCellsAsync_ShouldUpdateMultipleCells` | 3 cella típusának egyszerre módosítása (entrance, shelf_area, wall), ellenőrzi, hogy a többi 6 corridor maradt |

### 3. ShelfLogicTests (10 teszt)

A `ShelfLogic` service polcok CRUD műveleteit és a rekeszek (compartment) kezelését teszteli. A setup létrehoz egy 3×3-as raktárat, és az első cellát shelf_area típusra állítja.

| Teszt | Leírás |
|-------|--------|
| `CreateShelfAsync_ShouldCreateWithAutoCode` | Polc létrehozása, a Code automatikusan "A" lesz |
| `CreateShelfAsync_ShouldAutoIncrementCode` | 3 polc létrehozása → A, B, C kódok automatikusan |
| `GetShelvesByCellIdAsync_ShouldReturnShelves` | 2 polc listázása egy cellából |
| `GetShelfDetailAsync_ShouldReturnShelfWithCompartments` | Polc részleteinek lekérése üres rekesz listával |
| `AddCompartmentToLevelAsync_ShouldCreateCompartment` | Rekesz hozzáadása a 0. szinthez, LevelIndex/SlotIndex/Code ellenőrzése |
| `AddCompartmentToLevelAsync_ShouldAddMultipleSlots` | 3 rekesz egy szinten → SlotIndex 0, 1, 2 |
| `RemoveCompartmentFromLevelAsync_ShouldRemoveLastSlot` | 2 rekesz hozzáadása, 1 eltávolítása → 1 marad |
| `UpdateShelfAsync_ShouldUpdateProperties` | Polc tulajdonságok frissítése (Levels, AccessibleFromBothSides) |
| `DeleteShelfAsync_ShouldRemoveShelf` | Polc törlése és ellenőrzés |
| `DeleteShelfAsync_ShouldReturnFalseForInvalidId` | Nem létező polc törlése false-t ad vissza |

---

## Összesítés

| Tesztosztály | Tesztek száma | Státusz |
|--------------|:-------------:|:-------:|
| WarehouseLogicTests | 7 | PASSED |
| WarehouseCellLogicTests | 6 | PASSED |
| ShelfLogicTests | 10 | PASSED |
| **Összesen** | **23** | **PASSED** |
