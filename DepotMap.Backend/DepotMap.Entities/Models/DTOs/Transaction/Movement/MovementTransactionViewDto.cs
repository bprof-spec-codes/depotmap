namespace DepotMap.Entities.Models.DTOs.Transaction.Movement
{
    public class MovementTransactionViewDto
    {
        public string Id { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public List<MovementTransactionItemViewDto> Items { get; set; } = new();
    }
}
