using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Logics.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _hasher;
        private readonly JwtService _jwtService;

        public AuthController(AppDbContext context, IPasswordHasher<User> hasher, JwtService jwtService)
        {
            _context = context;
            _hasher = hasher;
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Identifier == dto.Identifier);

            if (user == null)
                return Unauthorized("Hibás azonosító vagy jelszó.");

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized("Hibás azonosító vagy jelszó.");

            var token = _jwtService.GenerateToken(user);
            return Ok(new { token });
        }
    }

    public class LoginDto
    {
        public string Identifier { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
