using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Purchasing
{
	public class CreatePurchasingTransactionDto
	{
		public string CreatedByUserId { get; set; } = string.Empty;
	}
}