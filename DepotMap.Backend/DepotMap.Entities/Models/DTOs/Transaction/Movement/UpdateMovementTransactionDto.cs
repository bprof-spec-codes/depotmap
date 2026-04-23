namespace DepotMap.Entities.Models.DTOs.Transaction.Movement
{
    public class UpdateMovementTransactionDto
    {
        public List<CreateMovementTransactionItemDto>? Items { get; set; }
        public string? Status { get; set; }
    }
}
