using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DepotMap.Data.Migrations
{
    /// <inheritdoc />
    public partial class ShelfCodePerWarehouse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Drop old global unique index
            migrationBuilder.DropIndex(
                name: "IX_Shelves_Code",
                table: "Shelves");

            // 2. Add column as nullable first
            migrationBuilder.AddColumn<string>(
                name: "WarehouseId",
                table: "Shelves",
                type: "nvarchar(450)",
                nullable: true);

            // 3. Backfill from WarehouseCells
            migrationBuilder.Sql(@"
                UPDATE s
                SET s.WarehouseId = c.WarehouseId
                FROM Shelves s
                INNER JOIN WarehouseCells c ON s.WarehouseCellId = c.Id
            ");

            // 4. Make NOT NULL
            migrationBuilder.AlterColumn<string>(
                name: "WarehouseId",
                table: "Shelves",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            // 5. New composite unique index (per-warehouse)
            migrationBuilder.CreateIndex(
                name: "IX_Shelves_WarehouseId_Code",
                table: "Shelves",
                columns: new[] { "WarehouseId", "Code" },
                unique: true);

            // 6. FK
            migrationBuilder.AddForeignKey(
                name: "FK_Shelves_Warehouses_WarehouseId",
                table: "Shelves",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shelves_Warehouses_WarehouseId",
                table: "Shelves");

            migrationBuilder.DropIndex(
                name: "IX_Shelves_WarehouseId_Code",
                table: "Shelves");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Shelves");

            migrationBuilder.CreateIndex(
                name: "IX_Shelves_Code",
                table: "Shelves",
                column: "Code",
                unique: true);
        }
    }
}
