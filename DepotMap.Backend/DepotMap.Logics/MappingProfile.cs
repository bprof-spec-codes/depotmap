using System;
using AutoMapper;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.StockMovement;
using DepotMap.Entities.Models.DTOs.Transaction.Movement;
using DepotMap.Entities.Models.DTOs.Transaction.Order;
using DepotMap.Entities.Models.DTOs.Transaction.Purchasing;

namespace DepotMap.Logics
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<CreateOrderDto, Transaction>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Outbound"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Planning"))
                .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()));

            CreateMap<CreateOrderItemDto, TransactionItem>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Outbound"))
                .ForMember(dest => dest.ToCompartmentId, opt => opt.Ignore());

            CreateMap<Transaction, OrderViewDto>()
                .ForMember(dest => dest.UserIdentifier, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.Identifier : string.Empty))
    .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy.LastName + " " + src.CreatedBy.FirstName : string.Empty));

            CreateMap<UpdateOrderItemDto, TransactionItem>();

            CreateMap<TransactionItem, OrderItemViewDto>()
                .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU))
                .ForMember(dest => dest.FromCompartmentCode, opt => opt.MapFrom(src => src.FromCompartment != null ? src.FromCompartment.Code : string.Empty));

            CreateMap<CreatePurchasingTransactionDto, Transaction>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Inbound"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Planning"))
                .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()));

            CreateMap<CreatePurchasingTransactionItemDto, TransactionItem>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Inbound"))
                .ForMember(dest => dest.FromCompartmentId, opt => opt.Ignore());

            CreateMap<TransactionItem, PurchasingTransactionItemViewDto>()
                .ForMember(dest => dest.ToCompartmentId, opt => opt.MapFrom(src => src.ToCompartmentId ?? string.Empty));

            CreateMap<Transaction, PurchasingTransactionViewDto>();

            CreateMap<CreateMovementTransactionDto, Transaction>()
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Transfer"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Planning"))
                .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()));

            CreateMap<CreateMovementTransactionItemDto, TransactionItem>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Transfer"));

            CreateMap<TransactionItem, MovementTransactionItemViewDto>()
                .ForMember(dest => dest.FromCompartmentId, opt => opt.MapFrom(src => src.FromCompartmentId ?? string.Empty))
                .ForMember(dest => dest.ToCompartmentId, opt => opt.MapFrom(src => src.ToCompartmentId ?? string.Empty));

            CreateMap<Transaction, MovementTransactionViewDto>();

            CreateMap<StockMovement, StockMovementViewDto>()
                .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU))
                .ForMember(dest => dest.CompartmentCode, opt => opt.MapFrom(src => src.Compartment.Code))
                .ForMember(dest => dest.UserIdentifier, opt => opt.MapFrom(src => src.CreatedBy.Identifier))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.CreatedBy.LastName + " " + src.CreatedBy.FirstName));

            CreateMap<CreateStockMovementDto, StockMovement>();

            CreateMap<ProductStock, ProductStockViewDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
                .ForMember(dest => dest.SKU, opt => opt.MapFrom(src => src.Product.SKU))
                .ForMember(dest => dest.CompartmentCode, opt => opt.MapFrom(src => src.Compartment.Code))
                .ForMember(dest => dest.LowStockThreshold, opt => opt.MapFrom(src => src.Product.LowStockThreshold));
        }
    }
}