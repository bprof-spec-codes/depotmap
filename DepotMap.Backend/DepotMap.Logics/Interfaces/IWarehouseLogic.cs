using DepotMap.Entities.Models.DTOs;

namespace DepotMap.Logics.Interfaces
{
    public interface IWarehouseLogic
    {
        Task<List<WarehouseListDto>> GetAllAsync();
        Task<WarehouseDetailDto?> GetByIdAsync(string id);
        Task<WarehouseListDto> CreateAsync(CreateWarehouseDto dto);
        Task<WarehouseListDto?> UpdateAsync(string id, UpdateWarehouseDto dto);
        Task<bool> DeleteAsync(string id);
    }
}
