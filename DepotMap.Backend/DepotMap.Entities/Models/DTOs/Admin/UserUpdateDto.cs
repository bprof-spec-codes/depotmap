using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Admin
{
    public class UserUpdateDto
    {
        public string? Identifier { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
        public string? Position { get; set; }
    }
}
