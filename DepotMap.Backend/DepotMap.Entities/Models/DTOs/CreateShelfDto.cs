namespace DepotMap.Entities.Models.DTOs
{
    public class CreateShelfDto
    {
        public int X { get; set; }
        public int Y { get; set; }
        public int Levels { get; set; }
        public bool AccessibleFromBothSides { get; set; }
        public int? LadderRequiredFromLevel { get; set; }
    }
}
