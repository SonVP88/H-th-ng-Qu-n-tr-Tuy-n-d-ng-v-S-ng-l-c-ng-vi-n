using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Controllers;

/// <summary>
/// Controller xử lý các API liên quan đến Interview và Email
/// </summary>
[ApiController]
[Route("api/interviews")]
[Authorize]
public class InterviewController : ControllerBase
{
    private readonly IAiMatchingService _aiMatchingService;
    private readonly IEmailService _emailService;
    private readonly ILogger<InterviewController> _logger;
    private readonly IInterviewService _interviewService;

    public InterviewController(
        IAiMatchingService aiMatchingService,
        IEmailService emailService,
        ILogger<InterviewController> logger,
        IInterviewService interviewService)
    {
        _aiMatchingService = aiMatchingService;
        _emailService = emailService;
        _logger = logger;
        _interviewService = interviewService;
    }

    /// <summary>
    /// Sinh đoạn mở đầu email mời phỏng vấn (Draft)
    /// </summary>
    /// <param name="request">CandidateId và JobId</param>
    /// <returns>Đoạn mở đầu email (2-3 câu)</returns>
    [HttpPost("generate-opening")]
    public async Task<IActionResult> GenerateOpening([FromBody] GenerateOpeningRequest request)
    {
        try
        {
            _logger.LogInformation("📝 API GenerateOpening - CandidateId: {CandidateId}, JobId: {JobId}", 
                request.CandidateId, request.JobId);

            if (request.CandidateId == Guid.Empty || request.JobId == Guid.Empty)
            {
                return BadRequest(new { message = "CandidateId và JobId không được để trống" });
            }

            var opening = await _aiMatchingService.GenerateInterviewOpeningAsync(request.CandidateId, request.JobId);

            return Ok(new { opening });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Không tìm thấy dữ liệu");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi sinh đoạn mở đầu email");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi sinh nội dung email" });
        }
    }

    /// <summary>
    /// Sinh toàn bộ nội dung email từ chối (Draft)
    /// </summary>
    /// <param name="request">Thông tin ứng viên, lý do và ghi chú</param>
    /// <returns>Nội dung email từ chối dạng HTML</returns>
    [HttpPost("generate-rejection")]
    public async Task<IActionResult> GenerateRejection([FromBody] GenerateRejectionRequest request)
    {
        try
        {
            _logger.LogInformation("📝 API GenerateRejection - CandidateName: {CandidateName}, JobTitle: {JobTitle}", 
                request.CandidateName, request.JobTitle);

            if (string.IsNullOrWhiteSpace(request.CandidateName) || string.IsNullOrWhiteSpace(request.JobTitle))
            {
                return BadRequest(new { message = "CandidateName và JobTitle không được để trống" });
            }

            var body = await _aiMatchingService.GenerateRejectionEmailAsync(
                request.CandidateName, 
                request.JobTitle, 
                request.Reasons ?? new List<string>(), 
                request.Note ?? "");

            return Ok(new { body });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi sinh email từ chối");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi sinh nội dung email" });
        }
    }

    /// <summary>
    /// API gửi email thủ công (Send - sau khi HR đã review/edit)
    /// </summary>
    /// <param name="request">Thông tin email cần gửi</param>
    /// <returns>Kết quả gửi email</returns>
    [HttpPost("send-email-manual")]
    public async Task<IActionResult> SendEmailManual([FromBody] SendEmailManualRequest request)
    {
        try
        {
            _logger.LogInformation("📧 API SendEmailManual - ToEmail: {ToEmail}, Subject: {Subject}", 
                request.ToEmail, request.Subject);

            if (string.IsNullOrWhiteSpace(request.ToEmail))
            {
                return BadRequest(new { message = "Email người nhận không được để trống" });
            }

            if (string.IsNullOrWhiteSpace(request.Subject))
            {
                return BadRequest(new { message = "Tiêu đề email không được để trống" });
            }

            if (string.IsNullOrWhiteSpace(request.BodyHtml))
            {
                return BadRequest(new { message = "Nội dung email không được để trống" });
            }

            await _emailService.SendEmailAsync(request.ToEmail, request.Subject, request.BodyHtml);

            return Ok(new { message = "Email đã được gửi thành công!" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi email thủ công");
            return StatusCode(500, new { message = "Có lỗi xảy ra khi gửi email: " + ex.Message });
        }
    }

    /// <summary>
    /// API lấy lịch phỏng vấn cá nhân của người phỏng vấn (SECURITY: Lấy UserId từ JWT Token)
    /// </summary>
    /// <returns>Danh sách lịch phỏng vấn của người phỏng vấn hiện tại</returns>
    [HttpGet("my-schedule")]
    [Authorize(Roles = "INTERVIEWER, HR, ADMIN")]
    public async Task<IActionResult> GetMySchedule()
    {
        try
        {
            _logger.LogInformation("📅 API GetMySchedule - Lấy lịch phỏng vấn cá nhân");

            // SECURITY: Lấy CurrentUserId từ JWT Token (KHÔNG cho phép client truyền userId)
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var currentUserId))
            {
                _logger.LogWarning("⚠️ Unauthorized access attempt - UserId claim missing or invalid");
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập để xem lịch phỏng vấn." });
            }

            _logger.LogInformation("✅ Authenticated User - UserId: {UserId}", currentUserId);

            // Lấy danh sách lịch phỏng vấn từ service
            var interviews = await _interviewService.GetMyInterviewScheduleAsync(currentUserId);

            _logger.LogInformation("📊 Found {Count} interviews for InterviewerId: {InterviewerId}", 
                interviews.Count, currentUserId);

            return Ok(new 
            { 
                success = true, 
                data = interviews 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, " Error getting my interview schedule");
            return StatusCode(500, new 
            { 
                success = false, 
                message = "Có lỗi xảy ra khi lấy lịch phỏng vấn." 
            });
        }
    }
}

#region DTOs

/// <summary>
/// Request sinh đoạn mở đầu email mời phỏng vấn
/// </summary>
public class GenerateOpeningRequest
{
    public Guid CandidateId { get; set; }
    public Guid JobId { get; set; }
}

/// <summary>
/// Request sinh email từ chối
/// </summary>
public class GenerateRejectionRequest
{
    public string CandidateName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public List<string>? Reasons { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// Request gửi email thủ công
/// </summary>
public class SendEmailManualRequest
{
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
}

#endregion
