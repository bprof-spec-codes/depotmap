using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.StockMovement;

namespace DepotMap.Logics.Interfaces
{
    public interface IStockMovementLogic
    {
        Task<IEnumerable<StockMovementViewDto>> GetAllMovementsAsync();
        Task<IEnumerable<StockMovementViewDto>> GetMovementsByProductAsync(string productId);
        Task CreateMovementAsync(CreateStockMovementDto dto);
    }
}
