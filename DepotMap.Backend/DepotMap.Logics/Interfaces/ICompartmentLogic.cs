using DepotMap.Entities.Models.DTOs;

namespace DepotMap.Logics.Interfaces
{
    public interface ICompartmentLogic
    {
        Task<List<CompartmentDto>> GetAllCompartmentsAsync();
        Task<CompartmentDto?> GetCompartmentByIdAsync(string compartmentId);
    }
}
