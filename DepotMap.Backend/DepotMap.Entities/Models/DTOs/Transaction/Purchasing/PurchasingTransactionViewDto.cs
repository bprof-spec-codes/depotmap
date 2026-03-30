using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Purchasing
{
	public class PurchasingTransactionViewDto
	{
		public string Id { get; set; } = string.Empty;
		public string Status { get; set; } = string.Empty;
		public string Type { get; set; } = string.Empty;
		public DateTime Timestamp { get; set; }
		public string CreatedByUserId { get; set; } = string.Empty;
		public List<PurchasingTransactionItemViewDto> Items { get; set; } = new List<PurchasingTransactionItemViewDto>();
	}
}