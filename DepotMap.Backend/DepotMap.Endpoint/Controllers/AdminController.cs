using DepotMap.Entities.Models.DTOs.Admin;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin/users")]
    public class AdminController : ControllerBase
    {
        private readonly IUserAdminLogic _userAdminLogic;

        public AdminController(IUserAdminLogic userAdminLogic)
        {
            _userAdminLogic = userAdminLogic;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserAdminDto>>> GetUsers()
        {
            var users = await _userAdminLogic.GetUsersAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<ActionResult<UserAdminDto>> CreateUser(UserCreateDto dto)
        {
            var user = await _userAdminLogic.CreateUserAsync(dto);
            if (user == null) return BadRequest("Felhasználó már létezik");
            return CreatedAtAction(nameof(GetUsers), user);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserAdminDto>> UpdateUser(string id, UserUpdateDto dto)
        {
            var user = await _userAdminLogic.UpdateUserAsync(id, dto);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var success = await _userAdminLogic.DeleteUserAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
