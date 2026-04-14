using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DepotMap.Endpoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompartmentController : ControllerBase
    {
        private readonly ICompartmentLogic _compartmentLogic;

        public CompartmentController(ICompartmentLogic compartmentLogic)
        {
            _compartmentLogic = compartmentLogic;
        }

        [HttpGet]
        public async Task<ActionResult<List<CompartmentDto>>> GetAll()
        {
            var compartments = await _compartmentLogic.GetAllCompartmentsAsync();
            return Ok(compartments);
        }

        [HttpGet("{compartmentId}")]
        public async Task<ActionResult<CompartmentDto>> GetById(string compartmentId)
        {
            var compartment = await _compartmentLogic.GetCompartmentByIdAsync(compartmentId);
            if (compartment == null)
            {
                return NotFound();
            }

            return Ok(compartment);
        }
    }
}
