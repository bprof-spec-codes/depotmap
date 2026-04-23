using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models.DTOs.Transaction.Purchasing
{
	public class CreatePurchasingTransactionItemDto
	{
		public string ProductId { get; set; } = string.Empty;

		[Range(1, int.MaxValue, ErrorMessage = "A darabszám legalább 1 kell legyen!")]
		public int Quantity { get; set; }

		public string ToCompartmentId { get; set; } = string.Empty;
	}
}