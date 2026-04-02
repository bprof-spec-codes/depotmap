namespace DepotMap.Entities.Models.DTOs
{
    public class BatchUpdateCellsDto
    {
        public List<CellUpdateItem> Cells { get; set; } = new();
    }

    public class CellUpdateItem
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string CellType { get; set; } = null!;
    }
}
