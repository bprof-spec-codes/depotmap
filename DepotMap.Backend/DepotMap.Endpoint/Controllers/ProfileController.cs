using DepotMap.Entities.Models.DTOs;
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
                return Unauthorized();
            }

            var result = await _profileLogic.ChangePasswordAsync(userId, dto);

            if (result != null)
            {
                return BadRequest(result);
            }

            return Ok("Password changed successfully!");
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetOwnProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var profile = await _profileLogic.GetOwnProfileAsync(userId);

            if (profile == null)
            {
                return NotFound("User not found");
            }

            return Ok(profile);
        }
    }
}
