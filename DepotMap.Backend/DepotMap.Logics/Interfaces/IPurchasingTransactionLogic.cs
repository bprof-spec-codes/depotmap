using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DepotMap.Entities.Models.DTOs.Transaction.Purchasing;

namespace DepotMap.Logics.Interfaces
{
	public interface IPurchasingTransactionLogic
	{
		Task<List<PurchasingTransactionViewDto>> GetAllAsync();
		Task<List<PurchasingTransactionTableRowDto>> GetTableRowsAsync(
			int skip = 0,
			int take = 500,
			DateTime? date = null,
			string? status = null,
			string? createdByUserId = null,
			string? productId = null,
			string? toCompartmentId = null,
			int? quantity = null
		);
		Task<PurchasingTransactionViewDto?> GetByIdAsync(string id);
		Task<PurchasingTransactionViewDto> CreateAsync(CreatePurchasingTransactionDto dto);
		Task<PurchasingTransactionViewDto?> UpdateAsync(string id, UpdatePurchasingTransactionDto dto);
		Task<bool> DeleteAsync(string id);
	}
}

