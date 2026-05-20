using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DepotMap.Data.Migrations
{
    /// <inheritdoc />
    public partial class ShelfPerCellUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shelves_WarehouseCellId",
                table: "Shelves");

            migrationBuilder.CreateIndex(
                name: "IX_Shelves_WarehouseCellId",
                table: "Shelves",
                column: "WarehouseCellId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shelves_WarehouseCellId",
                table: "Shelves");

            migrationBuilder.CreateIndex(
                name: "IX_Shelves_WarehouseCellId",
                table: "Shelves",
                column: "WarehouseCellId");
        }
    }
}
