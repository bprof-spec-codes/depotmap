using DepotMap.Entities.Models.DTOs;
using DepotMap.Logics.Logics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Interfaces
{
    public interface IWarehousePathFindingLogic
    {
        Task<List<PickingTaskDto>> GetOrderPickingRouteAsync(string orderId);
        Task<PickingRouteMapDto> GetOrderPickingRouteMapAsync(string orderId);
    }
}
