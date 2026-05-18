using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Helpers;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileLogic _profileLogic;

        public ProfileController(IProfileLogic profileLogic)
        {
            _profileLogic = profileLogic;
        }

        [HttpPut("updatePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                throw new ForbiddenException("A felhasználó azonosítása sikertelen.");
            }

            await _profileLogic.ChangePasswordAsync(userId, dto);

            return Ok(new
            {
                message = "A jelszó sikeresen módosítva."
            });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetOwnProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                throw new ForbiddenException("A felhasználó azonosítása sikertelen.");
            }

            var profile = await _profileLogic.GetOwnProfileAsync(userId);

            return Ok(profile);
        }
    }
}
