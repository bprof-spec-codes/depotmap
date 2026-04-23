using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DepotMap.Data.Migrations
{
    /// <inheritdoc />
    public partial class NullableProductId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductHistories_Products_ProductId",
                table: "ProductHistories");

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "ProductHistories",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductHistories_Products_ProductId",
                table: "ProductHistories",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductHistories_Products_ProductId",
                table: "ProductHistories");

            migrationBuilder.AlterColumn<string>(
                name: "ProductId",
                table: "ProductHistories",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductHistories_Products_ProductId",
                table: "ProductHistories",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
