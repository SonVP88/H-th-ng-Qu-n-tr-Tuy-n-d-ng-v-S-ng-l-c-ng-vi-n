using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UTC_DATN.DTOs.Job;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobsController : ControllerBase
{
    private readonly IJobService _jobService;

    public JobsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    /// <summary>
    /// API đăng tin tuyển dụng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest request)
    {
        try
        {
            // Validate model
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Lấy UserId từ token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized(new { message = "Không thể xác thực người dùng" });
            }

            // Gọi service
            var result = await _jobService.CreateJobAsync(request, userId);

            if (result)
            {
                return Ok(new { message = "Đăng tin tuyển dụng thành công" });
            }
            else
            {
                return BadRequest(new { message = "Đăng tin tuyển dụng thất bại" });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Lỗi: {ex.Message}" });
        }
    }

    /// <summary>
    /// API lấy danh sách job mới nhất cho trang chủ
    /// </summary>
    [HttpGet("latest/{count}")]
    [AllowAnonymous] // Cho phép truy cập không cần token
    public async Task<IActionResult> GetLatestJobs(int count = 10)
    {
        try
        {
            var jobs = await _jobService.GetLatestJobsAsync(count);
            return Ok(jobs);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Lỗi: {ex.Message}" });
        }
    }

    /// <summary>
    /// API lấy chi tiết job theo ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous] // Cho phép truy cập không cần token
    public async Task<IActionResult> GetJobById(Guid id)
    {
        try
        {
            var job = await _jobService.GetJobByIdAsync(id);
            
            if (job == null)
            {
                return NotFound(new { message = "Không tìm thấy công việc" });
            }
            
            return Ok(job);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Lỗi: {ex.Message}" });
        }
    }
}
