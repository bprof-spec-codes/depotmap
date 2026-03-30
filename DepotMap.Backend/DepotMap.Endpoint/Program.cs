using System.Text;
using DepotMap.Data.Context;
using DepotMap.Data.DbSeeder;
using DepotMap.Entities.Models;
using DepotMap.Logics;
using DepotMap.Logics.Interfaces;
using DepotMap.Logics.Logics;
using DepotMap.Logics.Services;
using DepotMap.Entities.Models.DTOs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);


        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
                };
            });
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAngular", policy =>
            {
                policy.WithOrigins("http://localhost:4200")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        builder.Services.AddScoped<IAuthLogic, AuthLogic>();
        builder.Services.AddScoped<IWarehouseLogic, WarehouseLogic>();
        builder.Services.AddScoped<IWarehouseCellLogic, WarehouseCellLogic>();
        builder.Services.AddScoped<IShelfLogic, ShelfLogic>();
        builder.Services.AddScoped<DbSeeder>();
        builder.Services.AddScoped<JwtService>();
        builder.Services.AddScoped<IOrderLogic, OrderLogic>();
        builder.Services.AddScoped<IOrderItemLogic, OrderItemLogic>();
        builder.Services.AddScoped<ProductsLogic>();
        builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        builder.Services.AddAutoMapper(typeof(MappingProfile));

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("AllowAngular");

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();
        using (var scope = app.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
            seeder.Seed();
        }
        app.Run();
    }
}