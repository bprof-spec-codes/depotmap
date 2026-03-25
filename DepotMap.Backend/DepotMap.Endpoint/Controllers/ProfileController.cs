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

        [HttpPut("change-password")]
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
    }
}
