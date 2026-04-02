namespace DepotMap.Entities.Models.DTOs
{
    public class UpdateShelfDto
    {
        public int Levels { get; set; }
        public bool AccessibleFromBothSides { get; set; }
        public int? LadderRequiredFromLevel { get; set; }
    }
}
