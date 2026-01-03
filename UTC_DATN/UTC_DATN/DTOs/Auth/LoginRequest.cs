using System.ComponentModel.DataAnnotations;

namespace UTC_DATN.DTOs.Auth
{
    public class LoginRequest
    {
        [Required]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;
    }
}
