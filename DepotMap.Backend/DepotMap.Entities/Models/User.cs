using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Entities.Models
{
public class User
{
    //Itt majd bizonyos propokat ki kell törölni, ha a beépített User kezelést használjuk
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Identifier { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    // Lehetséges értékek: még átbeszélni
    public string Role { get; set; } = null!;
    public string Position { get; set; } = null!;
}
}
