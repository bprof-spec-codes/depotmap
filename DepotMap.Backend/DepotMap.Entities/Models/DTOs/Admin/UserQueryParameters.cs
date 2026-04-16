using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Admin
{
    public class UserQueryParameters
    {
        public string? Search { get; set; }
        public string? SortBy { get; set; }
        public string SortDirection { get; set; } = "asc";
    }
}
