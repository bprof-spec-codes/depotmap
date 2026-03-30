using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Entities.Models;
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
                .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()));

            CreateMap<CreateOrderItemDto, TransactionItem>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid().ToString()))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => "Outbound"))
                .ForMember(dest => dest.ToCompartmentId, opt => opt.Ignore());

            CreateMap<Transaction, OrderViewDto>();


            CreateMap<UpdateOrderItemDto, TransactionItem>();

            CreateMap<TransactionItem, OrderItemViewDto>();

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
        }
    }
}
