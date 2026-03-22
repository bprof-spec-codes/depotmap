namespace DepotMap.Entities.Models.DTOs
{
    public class CreateWarehouseDto
    {
        public string Name { get; set; } = null!;
        public int GridWidth { get; set; }
        public int GridHeight { get; set; }
    }
}
