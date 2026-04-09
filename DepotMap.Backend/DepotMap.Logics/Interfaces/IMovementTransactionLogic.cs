using DepotMap.Entities.Models.DTOs.Transaction.Movement;

namespace DepotMap.Logics.Interfaces
{
    public interface IMovementTransactionLogic
    {
        Task<List<MovementTransactionViewDto>> GetAllAsync();
        Task<List<MovementTransactionTableRowDto>> GetTableRowsAsync(int skip = 0, int take = 500);
        Task<MovementTransactionViewDto?> GetByIdAsync(string id);
        Task<MovementTransactionViewDto> CreateAsync(CreateMovementTransactionDto dto);
        Task<MovementTransactionViewDto?> UpdateAsync(string id, UpdateMovementTransactionDto dto);
        Task<bool> DeleteAsync(string id);
    }
}
