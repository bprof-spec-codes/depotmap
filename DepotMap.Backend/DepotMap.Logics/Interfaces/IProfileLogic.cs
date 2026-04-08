using DepotMap.Entities.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Interfaces
{
    public interface IProfileLogic
    {
        Task<string> ChangePasswordAsync(string userId, ChangePasswordDto dto);
        Task<OwnProfileDto?> GetOwnProfileAsync(string userId);
    }
}
