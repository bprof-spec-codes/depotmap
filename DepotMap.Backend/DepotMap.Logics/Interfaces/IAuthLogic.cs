using DepotMap.Entities.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Interfaces
{
    public interface IAuthLogic
    {
        Task<string?> LoginAsync(LoginDto dto);
    }
}
