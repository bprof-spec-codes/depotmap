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
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Manager");
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-2", "user2", "Operator");

            var result = await logic.GetUsersAsync(new UserQueryParameters());

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task GetUsersAsync_ShouldReturnAllRoles()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "manager1", "Manager");
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-2", "officer1", "Officer");
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-3", "operator1", "Operator");

            var result = await logic.GetUsersAsync(new UserQueryParameters());

            Assert.Equal(3, result.Count);
            Assert.Contains(result, u => u.Role == "Manager");
            Assert.Contains(result, u => u.Role == "Officer");
            Assert.Contains(result, u => u.Role == "Operator");
        }

        [Fact]
        public async Task CreateUserAsync_ShouldCreateNewUser_AsManager()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.CreateUserAsync(new UserCreateDto
            {
                Identifier = "newmanager",
                FirstName = "Új",
                LastName = "Manager",
                Password = "Pass123!",
                Role = "Manager",
                Position = "Raktárvezető"
            });

            Assert.NotNull(result);
            Assert.Equal("newmanager", result.Identifier);
            Assert.Equal("Manager", result.Role);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldCreateNewUser_AsOfficer()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.CreateUserAsync(new UserCreateDto
            {
                Identifier = "newofficer",
                FirstName = "Új",
                LastName = "Irodista",
                Password = "Pass123!",
                Role = "Officer",
                Position = "Irodista"
            });

            Assert.NotNull(result);
            Assert.Equal("newofficer", result.Identifier);
            Assert.Equal("Officer", result.Role);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldCreateNewUser_AsOperator()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.CreateUserAsync(new UserCreateDto
            {
                Identifier = "newoperator",
                FirstName = "Új",
                LastName = "Raktáros",
                Password = "Pass123!",
                Role = "Operator",
                Position = "Raktáros"
            });

            Assert.NotNull(result);
            Assert.Equal("newoperator", result.Identifier);
            Assert.Equal("Operator", result.Role);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldReturnNull_IfIdentifierExists()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "existing", "Manager");

            var result = await logic.CreateUserAsync(new UserCreateDto
            {
                Identifier = "existing",
                FirstName = "Dup",
                LastName = "User",
                Password = "pass",
                Role = "Officer"
            });

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldUpdateUser()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Operator");

            var result = await logic.UpdateUserAsync("U-1", new UserUpdateDto
            {
                Role = "Manager",
                FirstName = "Frissített"
            });

            Assert.NotNull(result);
            Assert.Equal("Manager", result.Role);
            Assert.Equal("Frissített User", result.FullName);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldUpdateRole_ToOfficer()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Operator");

            var result = await logic.UpdateUserAsync("U-1", new UserUpdateDto
            {
                Role = "Officer"
            });

            Assert.NotNull(result);
            Assert.Equal("Officer", result.Role);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldReturnNull_ForInvalidId()
        {
            var (_, _, logic) = UserAdminTestHelper.Create();

            var result = await logic.UpdateUserAsync("nonexistent", new UserUpdateDto { Role = "Manager" });

            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldDeleteUser()
        {
            var (context, hasher, logic) = UserAdminTestHelper.Create();
            await UserAdminTestHelper.AddUserAsync(context, hasher, "U-1", "user1", "Operator");

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