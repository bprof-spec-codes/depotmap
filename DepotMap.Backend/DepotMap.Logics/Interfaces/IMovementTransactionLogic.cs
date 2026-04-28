using DepotMap.Entities.Models.DTOs.Transaction.Movement;

namespace DepotMap.Logics.Interfaces
{
    public interface IMovementTransactionLogic
    {
        Task<List<MovementTransactionViewDto>> GetAllAsync();
        Task<List<MovementTransactionTableRowDto>> GetTableRowsAsync(
            int skip = 0,
            int take = 500,
            DateTime? date = null,
            string? status = null,
            string? createdByUserId = null,
            string? productId = null,
            string? fromCompartmentId = null,
            string? toCompartmentId = null,
            int? quantity = null);
        Task<MovementTransactionViewDto?> GetByIdAsync(string id);
        Task<MovementTransactionViewDto> CreateAsync(CreateMovementTransactionDto dto);
        Task<MovementTransactionViewDto?> UpdateAsync(string id, UpdateMovementTransactionDto dto, string userRole);
        Task<bool> DeleteAsync(string id);
    }
}
