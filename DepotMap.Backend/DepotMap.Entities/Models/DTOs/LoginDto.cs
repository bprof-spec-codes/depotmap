using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs
{
    public class LoginDto
    {
        public string Identifier { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
