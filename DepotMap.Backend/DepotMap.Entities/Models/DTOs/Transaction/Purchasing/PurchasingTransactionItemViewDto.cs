using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Purchasing
{
	public class PurchasingTransactionItemViewDto
	{
		public string ProductId { get; set; } = string.Empty;
		public int Quantity { get; set; }
		public string ToCompartmentId { get; set; } = string.Empty;
	}
}