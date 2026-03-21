namespace DepotMap.Entities.Models.DTOs
{
    public class WarehouseCellDto
    {
        public string Id { get; set; } = null!;
        public int X { get; set; }
        public int Y { get; set; }
        public string CellType { get; set; } = null!;
    }
}
