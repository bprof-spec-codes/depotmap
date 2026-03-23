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
