using DepotMap.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Tests
{
    public static class TestDbHelper
    {
        public static AppDbContext CreateContext(string? dbName = null)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }
    }
}
