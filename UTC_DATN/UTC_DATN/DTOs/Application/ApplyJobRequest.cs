using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace UTC_DATN.DTOs.Application;

public class ApplyJobRequest
{
    [Required(ErrorMessage = "JobId là bắt buộc")]
    public Guid JobId { get; set; }

    [Required(ErrorMessage = "Họ tên là bắt buộc")]
    [StringLength(200, ErrorMessage = "Họ tên không được vượt quá 200 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [StringLength(320, ErrorMessage = "Email không được vượt quá 320 ký tự")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
    [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
    [StringLength(50, ErrorMessage = "Số điện thoại không được vượt quá 50 ký tự")]
    public string Phone { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Giới thiệu không được vượt quá 2000 ký tự")]
    public string? Introduction { get; set; }

    [Required(ErrorMessage = "File CV là bắt buộc")]
    public IFormFile CVFile { get; set; } = null!;
}
