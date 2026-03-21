namespace DepotMap.Entities.Models.DTOs
{
    public class UpdateWarehouseDto
    {
        public string Name { get; set; } = null!;
        public int GridWidth { get; set; }
        public int GridHeight { get; set; }
    }
}
