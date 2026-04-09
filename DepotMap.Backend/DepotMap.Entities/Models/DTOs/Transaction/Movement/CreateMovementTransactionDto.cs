namespace DepotMap.Entities.Models.DTOs.Transaction.Movement
{
    public class CreateMovementTransactionDto
    {
        public string CreatedByUserId { get; set; } = string.Empty;
        public List<CreateMovementTransactionItemDto> Items { get; set; } = new List<CreateMovementTransactionItemDto>();
    }
}
