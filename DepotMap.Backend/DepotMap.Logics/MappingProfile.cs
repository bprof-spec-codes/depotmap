using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs.Transaction.Order;



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
        }
    }
}
