using DepotMap.Entities.Models.DTOs;

namespace DepotMap.Logics.Interfaces
{
    public interface IShelfLogic
    {
        Task<List<ShelfListDto>> GetShelvesByCellIdAsync(string cellId);
        Task<ShelfDetailDto?> GetShelfDetailAsync(string shelfId);
        Task<ShelfListDto> CreateShelfAsync(string cellId, CreateShelfDto dto);
        Task<ShelfListDto?> UpdateShelfAsync(string shelfId, UpdateShelfDto dto);
        Task<bool> DeleteShelfAsync(string shelfId);
        Task<ShelfDetailDto?> AddCompartmentToLevelAsync(string shelfId, int levelIndex);
        Task<ShelfDetailDto?> RemoveCompartmentFromLevelAsync(string shelfId, int levelIndex);
    }
}
