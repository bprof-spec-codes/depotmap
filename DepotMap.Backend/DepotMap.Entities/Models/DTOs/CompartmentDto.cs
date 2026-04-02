using DepotMap.Entities.Models.DTOs.Products;

namespace DepotMap.Entities.Models.DTOs
{
    public class CompartmentDto
    {
        public string Id { get; set; } = null!;
        public int LevelIndex { get; set; }
        public int SlotIndex { get; set; }
        public string Code { get; set; } = null!;
        public List<ProductStockInfoDto> ProductStocks { get; set; } = new();
    }
}
