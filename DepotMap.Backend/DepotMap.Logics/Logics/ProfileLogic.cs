using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
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
    public class ProfileLogic : IProfileLogic
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _passwordHasher;

        public ProfileLogic(AppDbContext context, IPasswordHasher<User> passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<string> ChangePasswordAsync(string userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return "User not found!";
            }

            if (dto.NewPassword != dto.ConfirmNewPassword)
            {
                return "New passwords do not match!";
            }

            var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.CurrentPassword
            );

            if (passwordVerificationResult == PasswordVerificationResult.Failed)
            {
                return "Current password is incorrect!";
            }

            var samePasswordCheck = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                dto.NewPassword
            );

            if (samePasswordCheck == PasswordVerificationResult.Success)
            {
                return "New password cannot be the same as the old password!";
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);

            await _context.SaveChangesAsync();

            return null;
        }
    }
}
