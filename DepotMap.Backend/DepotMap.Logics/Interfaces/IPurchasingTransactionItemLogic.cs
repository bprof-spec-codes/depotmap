using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.Transaction.Purchasing;

namespace DepotMap.Logics.Interfaces
{
	public interface IPurchasingTransactionItemLogic
	{
		Task<PurchasingTransactionViewDto?> AddItemAsync(string transactionId, CreatePurchasingTransactionItemDto dto);
	}
}
