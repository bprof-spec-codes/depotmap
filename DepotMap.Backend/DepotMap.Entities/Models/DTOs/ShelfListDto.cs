namespace DepotMap.Entities.Models.DTOs
{
    public class ShelfListDto
    {
        public string Id { get; set; } = null!;
        public string Code { get; set; } = null!;
        public int X { get; set; }
        public int Y { get; set; }
        public int Levels { get; set; }
        public bool AccessibleFromBothSides { get; set; }
    }
}
