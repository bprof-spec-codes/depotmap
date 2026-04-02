using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Admin
{
    public class UserCreateDto
    {
        public string Identifier { get; set; } = string.Empty;  // Pl. "admin001"
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Raktáros";
        public string Position { get; set; } = string.Empty;
    }
}
