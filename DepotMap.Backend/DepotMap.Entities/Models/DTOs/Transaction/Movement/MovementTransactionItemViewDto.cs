namespace DepotMap.Entities.Models.DTOs.Transaction.Movement
{
    public class MovementTransactionItemViewDto
    {
        public string ProductId { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string FromCompartmentId { get; set; } = string.Empty;
        public string ToCompartmentId { get; set; } = string.Empty;
    }
}
