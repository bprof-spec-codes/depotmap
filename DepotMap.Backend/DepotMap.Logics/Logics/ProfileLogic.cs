using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using DepotMap.Logics.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class ProfileLogic : IProfileLogic
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;

        public ProfileLogic(AppDbContext context, IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task ChangePasswordAsync(string userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new NotFoundException("A felhasználó nem található.");
            }

            if (dto.NewPassword != dto.ConfirmNewPassword)
            {
                throw new BadRequestException("Az új jelszavak nem egyeznek.");
            }

            var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.CurrentPassword
            );

            if (passwordVerificationResult == PasswordVerificationResult.Failed)
            {
                throw new BadRequestException("A jelenlegi jelszó hibás.");
            }

            var samePasswordCheck = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.NewPassword
            );

            if (samePasswordCheck == PasswordVerificationResult.Success)
            {
                throw new ConflictException("Az új jelszó nem egyezhet meg a régi jelszóval.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);

            await _context.SaveChangesAsync();
        }

        public async Task<OwnProfileDto?> GetOwnProfileAsync(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new NotFoundException("A felhasználó nem található.");
            }
            return new OwnProfileDto
            {
                Id = user.Id,
                Identifier = user.Identifier,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                Position = user.Position
            };
        }
    }
}
