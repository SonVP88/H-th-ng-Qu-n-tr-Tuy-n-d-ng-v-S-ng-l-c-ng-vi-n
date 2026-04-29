using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UTC_DATN.Migrations
{
    /// <inheritdoc />
    public partial class AddBreakdownJsonToAiScore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BreakdownJson",
                table: "ApplicationAiScores",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreakdownJson",
                table: "ApplicationAiScores");
        }
    }
}
