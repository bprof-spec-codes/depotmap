using DepotMap.Entities.Models.DTOs;

namespace DepotMap.Logics.Interfaces
{
    public interface IWarehouseCellLogic
    {
        Task<List<WarehouseCellDto>> GetCellsByWarehouseIdAsync(string warehouseId);
        Task<CellDetailDto?> GetCellDetailAsync(string cellId);
        Task<WarehouseCellDto?> UpdateCellTypeAsync(string cellId, UpdateCellTypeDto dto);
        Task<List<WarehouseCellDto>> BatchUpdateCellsAsync(string warehouseId, BatchUpdateCellsDto dto);
    }
}
