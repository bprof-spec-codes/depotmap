using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.StockMovement;

namespace DepotMap.Logics.Interfaces
{
    public interface IProductStockLogic
    {
        Task<IEnumerable<ProductStockViewDto>> GetAllStocksAsync();
        Task<IEnumerable<ProductStockViewDto>> GetStocksByProductAsync(string productId);
        Task<IEnumerable<ProductStockViewDto>> GetStocksByCompartmentAsync(string compartmentId);
    }
}
