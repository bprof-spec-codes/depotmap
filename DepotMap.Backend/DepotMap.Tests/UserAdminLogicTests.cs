using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Admin;
using DepotMap.Logics.Logics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DepotMap.Tests
{
    public class TestPasswordHasher : IPasswordHasher<User>
    {
        public string HashPassword(User user, string password) => $"HASH_{password}";
        public PasswordVerificationResult VerifyHashedPassword(User user, string hashedPassword, string providedPassword)
            => hashedPassword == $"HASH_{providedPassword}"
                ? PasswordVerificationResult.Success
                : PasswordVerificationResult.Failed;
    }

    public static class UserAdminTestHelper
    {
        public static (AppDbContext context, TestPasswordHasher hasher, UserAdminLogic logic) Create()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var context = new AppDbContext(options);
            var hasher = new TestPasswordHasher();
            var logic = new UserAdminLogic(context, hasher);
            return (context, hasher, logic);
        }

        public static async Task<User> AddUserAsync(AppDbContext context, TestPasswordHasher hasher, string id, string identifier, string role)
        {
            var user = new User
            {
                Id = id,
                Identifier = identifier,
                FirstName = "Teszt",
                LastName = "User",
                Role = role,
                Position = "Pozíció",
                PasswordHash = hasher.HashPassword(null!, "pass123")
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
            return user;
        }
    }

    public class UserAdminLogicTests
    {
        [Fact]
        public async Task GetUsersAsync_ShouldReturnAllUsers()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Admin");
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-2", "user2", "Raktáros");

            var result = await logic.GetUsersAsync();

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldCreateNewUser()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.CreateUserAsync(new UserCreateDto
            {
                Identifier = "newuser",
                FirstName = "Új",
                LastName = "User",
                Password = "Pass123!",
                Role = "Raktáros",
                Position = "Raktáros"
            });

            Assert.NotNull(result);
            Assert.Equal("newuser", result.Identifier);
            Assert.Equal("Raktáros", result.Role);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldReturnNull_IfIdentifierExists()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "existing", "Admin");

            var result = await logic.CreateUserAsync(new UserCreateDto
            {
                Identifier = "existing",
                FirstName = "Dup",
                LastName = "User",
                Password = "pass",
                Role = "Admin"
            });

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldUpdateUser()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            var user = await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Raktáros");

            var result = await logic.UpdateUserAsync("U-1", new UserUpdateDto
            {
                Role = "Admin",
                FirstName = "Frissített"
            });

            Assert.NotNull(result);
            Assert.Equal("Admin", result.Role);
            Assert.Equal("Frissített User", result.FullName);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldReturnNull_ForInvalidId()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.UpdateUserAsync("nonexistent", new UserUpdateDto { Role = "Admin" });

            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldDeleteUser()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Raktáros");

            var result = await logic.DeleteUserAsync("U-1");

            Assert.True(result);
            Assert.Empty(context.Users.Where(u => u.Id == "U-1"));
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldReturnFalse_ForInvalidId()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.DeleteUserAsync("nonexistent");

            Assert.False(result);
        }
    }

}

