using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using DepotMap.Logics.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Logics
{
    public class AuthLogic : IAuthLogic
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _hasher;
        private readonly JwtService _jwtService;

        public AuthLogic(AppDbContext context, IPasswordHasher<User> hasher, JwtService jwtService)
        {
            _context = context;
            _hasher = hasher;
            _jwtService = jwtService;
        }

        public async Task<string?> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Identifier == dto.Identifier);

            if (user == null) return null;

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed) return null;

            return _jwtService.GenerateToken(user);
        }
    }
}
