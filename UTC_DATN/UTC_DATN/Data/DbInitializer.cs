using Microsoft.EntityFrameworkCore;
using UTC_DATN.Entities;

namespace UTC_DATN.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(UTC_DATNContext context)
        {
            // Đảm bảo database đã được tạo
            await context.Database.EnsureCreatedAsync();

            await SeedRolesAsync(context);
            await SeedAdminUserAsync(context);
        }

        private static async Task SeedRolesAsync(UTC_DATNContext context)
        {
            // Kiểm tra xem đã có roles chưa
            if (await context.Roles.AnyAsync())
            {
                return; // Đã có roles rồi, không cần seed
            }

            var roles = new List<Role>
            {
                new Role
                {
                    RoleId = Guid.NewGuid(),
                    Code = "ADMIN",
                    Name = "Administrator",
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    RoleId = Guid.NewGuid(),
                    Code = "HR",
                    Name = "HR Manager",
                    CreatedAt = DateTime.UtcNow
                },
                new Role
                {
                    RoleId = Guid.NewGuid(),
                    Code = "INTERVIEWER",
                    Name = "Interviewer",
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Roles.AddRangeAsync(roles);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Đã tạo 3 roles: ADMIN, HR, INTERVIEWER");
        }

        private static async Task SeedAdminUserAsync(UTC_DATNContext context)
        {
            // Kiểm tra xem đã có admin user chưa
            var adminEmail = "admin@company.com";
            var existingAdmin = await context.Users
                .FirstOrDefaultAsync(u => u.Email == adminEmail);

            if (existingAdmin != null)
            {
                return; // Đã có admin user rồi
            }

            // Tìm role ADMIN
            var adminRole = await context.Roles
                .FirstOrDefaultAsync(r => r.Code == "ADMIN");

            if (adminRole == null)
            {
                Console.WriteLine("✗ Không tìm thấy role ADMIN để tạo admin user");
                return;
            }

            // Hash password bằng BCrypt
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");

            var adminUser = new User
            {
                UserId = Guid.NewGuid(),
                Email = adminEmail,
                NormalizedEmail = adminEmail.ToUpper().Trim(),
                PasswordHash = passwordHash,
                FullName = "System Administrator",
                Phone = "0000000000",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddAsync(adminUser);

            // Gán role ADMIN cho user
            var userRole = new UserRole
            {
                UserId = adminUser.UserId,
                RoleId = adminRole.RoleId,
                CreatedAt = DateTime.UtcNow
            };

            await context.UserRoles.AddAsync(userRole);
            await context.SaveChangesAsync();

            Console.WriteLine($"✓ Đã tạo admin user: {adminEmail} / Password123!");
        }
    }
}
