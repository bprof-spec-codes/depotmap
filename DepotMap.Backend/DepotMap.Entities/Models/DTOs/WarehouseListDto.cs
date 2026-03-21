namespace DepotMap.Entities.Models.DTOs
{
    public class WarehouseListDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public int GridWidth { get; set; }
        public int GridHeight { get; set; }
    }
}
