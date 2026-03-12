using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UTC_DATN.Data;
using UTC_DATN.DTOs.Account;

namespace UTC_DATN.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly UTC_DATNContext _context;

        public AccountController(UTC_DATNContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            
            if (userIdClaim == null)
            {
                userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            }

            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return userId;
            }
            return Guid.Empty;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            // Assuming single role for simplicity or verify implementation
            var role = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Candidate";

            return Ok(new UserProfileDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                Role = role,
                AvatarUrl = user.AvatarUrl ?? ""
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            if (!string.IsNullOrEmpty(dto.AvatarUrl))
            {
                user.AvatarUrl = dto.AvatarUrl;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật hồ sơ thành công" });
        }

        [HttpGet("company")]
        public async Task<IActionResult> GetCompanyInfo()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            return Ok(new CompanyInfoDto
            {
                Name = user.CompanyName,
                Website = user.CompanyWebsite,
                Industry = user.CompanyIndustry,
                Address = user.CompanyAddress,
                Description = user.CompanyDescription,
                LogoUrl = user.CompanyLogoUrl ?? ""
            });
        }

        [HttpGet("company-info")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicCompanyInfo()
        {
            var user = await _context.Users
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Admin"))
                .FirstOrDefaultAsync();

            if (user == null) return NotFound(new { message = "Không tìm thấy thông tin công ty" });

            return Ok(new CompanyInfoDto
            {
                Name = user.CompanyName,
                Website = user.CompanyWebsite,
                Industry = user.CompanyIndustry,
                Address = user.CompanyAddress,
                Description = user.CompanyDescription,
                LogoUrl = user.CompanyLogoUrl ?? ""
            });
        }

        [HttpPut("company")]
        public async Task<IActionResult> UpdateCompanyInfo([FromBody] UpdateCompanyDto dto)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            user.CompanyName = dto.Name;
            user.CompanyWebsite = dto.Website;
            user.CompanyIndustry = dto.Industry;
            user.CompanyAddress = dto.Address;
            user.CompanyDescription = dto.Description;
            user.CompanyLogoUrl = dto.LogoUrl;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin công ty thành công" });
        }

        // ==========================================
        // QUẢN LÝ ỨNG VIÊN BỞI ADMIN/HR
        // ==========================================

        [HttpGet("candidates")]
        [Authorize(Roles = "ADMIN,HR")]
        public async Task<IActionResult> GetCandidates([FromQuery] string searchTerm = "", [FromQuery] int pageConfig = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "CANDIDATE") || 
                           !u.UserRoles.Any(ur => ur.Role.Name == "ADMIN" || ur.Role.Name == "HR" || ur.Role.Name == "INTERVIEWER"));

            if (!string.IsNullOrEmpty(searchTerm))
            {
                var lowerSearch = searchTerm.ToLower();
                query = query.Where(u =>
                    (u.Email != null && u.Email.ToLower().Contains(lowerSearch)) ||
                    (u.FullName != null && u.FullName.ToLower().Contains(lowerSearch)) ||
                    (u.Phone != null && u.Phone.ToLower().Contains(lowerSearch))
                );
            }

            var totalItems = await query.CountAsync();
            var candidates = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((pageConfig - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    UserId = u.UserId,
                    Email = u.Email,
                    FullName = u.FullName,
                    Phone = u.Phone,
                    AvatarUrl = u.AvatarUrl,
                    IsActive = u.IsActive,
                    AuthProvider = u.AuthProvider,
                    CreatedAt = u.CreatedAt,
                    LockedAt = u.LockedAt,
                    LockedByName = u.LockedByName,
                    LockReason = u.LockReason
                })
                .ToListAsync();

            return Ok(new
            {
                data = candidates,
                total = totalItems,
                page = pageConfig,
                pageSize = pageSize
            });
        }

        [HttpPut("candidates/{id}/toggle-status")]
        [Authorize(Roles = "ADMIN,HR")]
        public async Task<IActionResult> ToggleCandidateStatus(Guid id, [FromBody] ToggleStatusDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.UserId == id);

            // Cho phép toggle nếu user có role CANDIDATE HOẶC user không có role ADMIN/HR (trường hợp user tự đăng ký thiếu role)
            bool isCandidate = user != null && 
                               (user.UserRoles.Any(ur => ur.Role.Name == "CANDIDATE") || 
                               !user.UserRoles.Any(ur => ur.Role.Name == "ADMIN" || ur.Role.Name == "HR" || ur.Role.Name == "INTERVIEWER"));

            if (user == null || !isCandidate)
            {
                return NotFound(new { message = "Không tìm thấy người dùng hoặc không phải Ứng viên." });
            }

            if (user.IsActive)
            {
                // Hành động khóa
                user.IsActive = false;
                user.LockedAt = DateTime.UtcNow;
                user.LockReason = string.IsNullOrEmpty(dto?.Reason) ? "Bị khóa bởi quản trị viên" : dto.Reason;
                
                var adminId = GetUserId();
                user.LockedById = adminId;
                
                // Cố gắng lấy tên Admin/HR thực hiện khóa
                var admin = await _context.Users.FindAsync(adminId);
                if (admin != null)
                {
                    user.LockedByName = admin.FullName;
                }
            }
            else
            {
                // Hành động mở khóa
                user.IsActive = true;
                user.LockedAt = null;
                user.LockedById = null;
                user.LockedByName = null;
                user.LockReason = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = user.IsActive ? "Đã MỞ KHÓA tài khoản ứng viên." : "Đã KHÓA tài khoản ứng viên thành công.",
                isActive = user.IsActive
            });
        }
    }

    public class ToggleStatusDto
    {
        public string Reason { get; set; }
    }
}
