namespace DepotMap.Entities.Models.DTOs
{
    public class WarehouseDetailDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public int GridWidth { get; set; }
        public int GridHeight { get; set; }
        public List<WarehouseCellDto> Cells { get; set; } = new();
    }
}
