using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Admin;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class UserAdminLogic : IUserAdminLogic
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;

        public UserAdminLogic(AppDbContext context, IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<List<UserAdminDto>> GetUsersAsync(UserQueryParameters queryParams)
        {
            IQueryable<User> query = _context.Users;
            if (!string.IsNullOrWhiteSpace(queryParams.Search))
            {
                var search = queryParams.Search.ToLower();
                query = query.Where(u =>
                    u.Identifier.ToLower().Contains(search) ||
                    (u.FirstName + " " + u.LastName).ToLower().Contains(search));
            }

            query = (queryParams.SortBy?.ToLower(), queryParams.SortDirection?.ToLower()) switch
            {
                ("identifier", "desc") => query.OrderByDescending(u => u.Identifier),
                ("identifier", _) => query.OrderBy(u => u.Identifier),
                ("role", "desc") => query.OrderByDescending(u => u.Role),
                ("role", _) => query.OrderBy(u => u.Role),
                ("position", "desc") => query.OrderByDescending(u => u.Position),
                ("position", _) => query.OrderBy(u => u.Position),
                ("fullname", "desc") => query.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName),
                _ => query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName),
            };

            return await query
            .Select(u => new UserAdminDto
            {
                Id = u.Id,
                FullName = u.FirstName + " " + u.LastName,
                Identifier = u.Identifier,
                Role = u.Role,
                Position = u.Position
            })
            .ToListAsync();
        }

        public async Task<UserAdminDto?> CreateUserAsync(UserCreateDto dto)
        {
            var existingUser = await _context.Users
                .AnyAsync(u => u.Identifier == dto.Identifier);
            if (existingUser) return null;

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Identifier = dto.Identifier,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = dto.Role,
                Position = dto.Position,
                PasswordHash = _passwordHasher.HashPassword(null!, dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserAdminDto
            {
                Id = user.Id,
                FullName = user.FirstName + " " + user.LastName,
                Identifier = user.Identifier,
                Role = user.Role,
                Position = user.Position
            };
        }

        public async Task<UserAdminDto?> UpdateUserAsync(string id, UserUpdateDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            if (!string.IsNullOrEmpty(dto.Identifier))
                user.Identifier = dto.Identifier;
            if (!string.IsNullOrEmpty(dto.FirstName))
                user.FirstName = dto.FirstName;
            if (!string.IsNullOrEmpty(dto.LastName))
                user.LastName = dto.LastName;
            if (!string.IsNullOrEmpty(dto.Role))
                user.Role = dto.Role;
            if (!string.IsNullOrEmpty(dto.Position))
                user.Position = dto.Position;

            if (!string.IsNullOrEmpty(dto.Password))
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            await _context.SaveChangesAsync();

            return new UserAdminDto
            {
                Id = user.Id,
                FullName = user.FirstName + " " + user.LastName,
                Identifier = user.Identifier,
                Role = user.Role,
                Position = user.Position
            };
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

