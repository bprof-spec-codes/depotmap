using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
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
        private readonly IAuthLogic _authLogic;

        public AuthController(IAuthLogic authLogic)
        {
            _authLogic = authLogic;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var token = await _authLogic.LoginAsync(dto);
            if (token == null)
                return Unauthorized("Hibás azonosító vagy jelszó.");

            return Ok(new { token });
        }
    }
}
