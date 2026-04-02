using DepotMap.Entities.Models.DTOs.Admin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Interfaces
{
    public interface IUserAdminLogic
    {
        Task<List<UserAdminDto>> GetUsersAsync();
        Task<UserAdminDto?> CreateUserAsync(UserCreateDto dto);
        Task<UserAdminDto?> UpdateUserAsync(string id, UserUpdateDto dto);
        Task<bool> DeleteUserAsync(string id);
    }
}
