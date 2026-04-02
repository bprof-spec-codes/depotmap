namespace DepotMap.Entities.Models.DTOs.Products
{
    public class ProductStockInfoDto
    {
        public string ProductId { get; set; } = null!;
        public string ProductName { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
