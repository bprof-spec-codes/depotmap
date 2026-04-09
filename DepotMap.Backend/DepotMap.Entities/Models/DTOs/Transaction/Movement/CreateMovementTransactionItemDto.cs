using System.ComponentModel.DataAnnotations;

namespace DepotMap.Entities.Models.DTOs.Transaction.Movement
{
    public class CreateMovementTransactionItemDto
    {
        public string ProductId { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "A darabszám legalább 1 kell legyen!")]
        public int Quantity { get; set; }

        public string FromCompartmentId { get; set; } = string.Empty;
        public string ToCompartmentId { get; set; } = string.Empty;
    }
}
