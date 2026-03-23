using AutoMapper;
using DepotMap.Entities.Models;
using DepotMap.Entities.Models.DTOs;
using DepotMap.Entities.Models.DTOs.Products;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Helpers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {

            CreateMap<CreateProductDto, Product>();//rekesz kell majd vissza
            CreateMap<Product, ProductsViewDto>();
            CreateMap<ProductHistory, ProductHistoryDto>();

            CreateMap<Product, ProductStockInfoDto>();

            CreateMap<ProductStock, ProductStockInfoDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
                .ForMember(dest => dest.SKU, opt => opt.MapFrom(src => src.Product.SKU));

            CreateMap<Compartment, CompartmentDto>();

            CreateMap<Product, ProductHistory>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ProductId, opt => opt.MapFrom(src => src.Id));
        }
    }
}
