using Microsoft.EntityFrameworkCore;
using UTC_DATN.Data;
using UTC_DATN.DTOs.Interview;
using UTC_DATN.Entities;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Services.Implements;

public class InterviewService : IInterviewService
{
    private readonly UTC_DATNContext _context;
    private readonly ILogger<InterviewService> _logger;

    public InterviewService(UTC_DATNContext context, ILogger<InterviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Submit kết quả đánh giá phỏng vấn
    /// Tự động cập nhật trạng thái Application dựa trên Result
    /// </summary>
    public async Task<Guid> SubmitEvaluationAsync(EvaluationDto dto)
    {
        try
        {
            _logger.LogInformation("📝 Submitting evaluation for InterviewId: {InterviewId}", dto.InterviewId);

            // Validate Interview exists
            var interview = await _context.Interviews
                .Include(i => i.Application)
                .FirstOrDefaultAsync(i => i.InterviewId == dto.InterviewId);

            if (interview == null)
            {
                throw new InvalidOperationException($"Không tìm thấy Interview với ID: {dto.InterviewId}");
            }

            // Validate Result
            var validResults = new[] { "Passed", "Failed", "Consider" };
            if (!validResults.Contains(dto.Result))
            {
                throw new ArgumentException($"Result phải là một trong các giá trị: {string.Join(", ", validResults)}");
            }

            // Tạo InterviewEvaluation
            var evaluation = new InterviewEvaluation
            {
                EvaluationId = Guid.NewGuid(),
                InterviewId = dto.InterviewId,
                InterviewerId = dto.InterviewerId,
                Score = dto.Score,
                Comment = dto.Comment,
                Result = dto.Result,
                Details = dto.Details,
                CreatedAt = DateTime.UtcNow
            };

            _context.InterviewEvaluations.Add(evaluation);

            // Tự động cập nhật trạng thái Application
            var application = interview.Application;
            if (application != null)
            {
                string newStatus = dto.Result switch
                {
                    "Passed" => "OFFER_PENDING",
                    "Failed" => "REJECTED",
                    _ => application.Status // "Consider" giữ nguyên status hiện tại
                };

                if (application.Status != newStatus && dto.Result != "Consider")
                {
                    application.Status = newStatus;
                    _logger.LogInformation("✅ Updated Application {AppId} status to {Status}", 
                        application.ApplicationId, newStatus);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Evaluation submitted successfully with ID: {EvaluationId}", evaluation.EvaluationId);
            return evaluation.EvaluationId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error submitting evaluation for InterviewId: {InterviewId}", dto.InterviewId);
            throw;
        }
    }
}
