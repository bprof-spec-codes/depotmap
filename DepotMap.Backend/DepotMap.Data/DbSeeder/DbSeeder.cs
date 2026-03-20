using DepotMap.Data.Context;
using DepotMap.Entities.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Data.DbSeeder
{
    public class DbSeeder
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<User> _hasher;
        private readonly IConfiguration _config;

        public DbSeeder(AppDbContext db, IPasswordHasher<User> hasher, IConfiguration config)
        {
            _db = db;
            _hasher = hasher;
            _config = config;
        }

        public void Seed()
        {
            if (!_db.Users.Any())
            {
                var user = new User
                {
                    Id = "seed-admin-001",
                    Identifier = _config["SeedAdmin:Identifier"]!,
                    FirstName = _config["SeedAdmin:FirstName"]!,
                    LastName = _config["SeedAdmin:LastName"]!,
                    Role = "superadmin",
                    Position = _config["SeedAdmin:Position"]!,
                    PasswordHash = ""
                };
                user.PasswordHash = _hasher.HashPassword(user, _config["SeedAdmin:Password"]!);
                _db.Users.Add(user);
                _db.SaveChanges();
            }
        }
    }
}
