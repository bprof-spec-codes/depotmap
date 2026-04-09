namespace DepotMap.Entities.Models.DTOs.Transaction.Movement
{
    public class MovementTransactionTableRowDto
    {
        public string TransactionId { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string FromCompartmentId { get; set; } = string.Empty;
        public string ToCompartmentId { get; set; } = string.Empty;
    }
}
