using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using UTC_DATN.DTOs.Interview;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Controllers;

[ApiController]
[Route("api/evaluation")]
[Authorize(Roles = "HR, ADMIN, INTERVIEWER")]
public class EvaluationController : ControllerBase
{
    private readonly IInterviewService _interviewService;
    private readonly IAiMatchingService _aiMatchingService;
    private readonly ILogger<EvaluationController> _logger;

    public EvaluationController(
        IInterviewService interviewService,
        IAiMatchingService aiMatchingService,
        ILogger<EvaluationController> logger)
    {
        _interviewService = interviewService;
        _aiMatchingService = aiMatchingService;
        _logger = logger;
    }

    /// <summary>
    /// API Submit kết quả đánh giá phỏng vấn
    /// Tự động cập nhật trạng thái Application dựa trên Result
    /// </summary>
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitEvaluation([FromBody] EvaluationDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
            }

            var evaluationId = await _interviewService.SubmitEvaluationAsync(dto);

            return Ok(new
            {
                success = true,
                message = "Đã lưu kết quả đánh giá thành công",
                data = new { evaluationId }
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error khi submit evaluation");
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Business logic error khi submit evaluation");
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi hệ thống khi submit evaluation");
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lưu kết quả đánh giá" });
        }
    }

    /// <summary>
    /// Lấy chi tiết đánh giá của một buổi phỏng vấn
    /// </summary>
    [HttpGet("{interviewId}")]
    public async Task<IActionResult> GetEvaluationByInterviewId(Guid interviewId)
    {
        try
        {
            var evaluation = await _interviewService.GetEvaluationByInterviewIdAsync(interviewId);

            if (evaluation == null)
            {
                return NotFound(new { success = false, message = "Chưa có đánh giá nào cho buổi phỏng vấn này" });
            }

            return Ok(new
            {
                success = true,
                data = evaluation
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy chi tiết đánh giá InterviewId: {InterviewId}", interviewId);
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin đánh giá" });
        }
    }

    /// <summary>
    /// API AI Judge - Đánh giá câu trả lời bằng AI
    /// </summary>
    [HttpPost("ai-judge")]
    public async Task<IActionResult> AiJudge([FromBody] AiJudgeRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
            }

            if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.CandidateAnswer))
            {
                return BadRequest(new { success = false, message = "Câu hỏi và câu trả lời không được để trống" });
            }

            var resultJson = await _aiMatchingService.EvaluateAnswerAsync(request.Question, request.CandidateAnswer);

            // Parse JSON để trả về cấu trúc rõ ràng
            try
            {
                using var document = JsonDocument.Parse(resultJson);
                var root = document.RootElement;
                
                var response = new AiJudgeResponseDto
                {
                    Score = root.GetProperty("score").GetInt32(),
                    Assessment = root.GetProperty("assessment").GetString() ?? ""
                };

                return Ok(new
                {
                    success = true,
                    data = response
                });
            }
            catch (JsonException)
            {
                // Nếu parse lỗi, trả về raw JSON
                return Ok(new
                {
                    success = true,
                    data = resultJson
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gọi AI Judge");
            return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi đánh giá câu trả lời" });
        }
    }
}
