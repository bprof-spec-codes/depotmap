using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs
{
    public class CreatePurchaseDto
    {
        public List<CreatePurchaseItemDto> Items { get; set; } = new();
    }
}
