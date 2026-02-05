using UTC_DATN.DTOs.Interview;
using UTC_DATN.DTOs;

namespace UTC_DATN.Services.Interfaces;

public interface IInterviewService
{
    /// <summary>
    /// Lên lịch phỏng vấn cho một Application
    /// Validate Interviewer tồn tại và có role INTERVIEWER
    /// </summary>
    Task<Guid> ScheduleInterviewAsync(ScheduleInterviewDto dto, Guid createdBy);

    /// <summary>
    /// Submit kết quả đánh giá phỏng vấn
    /// Tự động cập nhật trạng thái Application dựa trên Result
    /// </summary>
    Task<Guid> SubmitEvaluationAsync(EvaluationDto dto);

    /// <summary>
    /// Lấy chi tiết đánh giá theo InterviewId
    /// </summary>
    Task<EvaluationDto?> GetEvaluationByInterviewIdAsync(Guid interviewId);

    /// <summary>
    /// Lấy danh sách lịch phỏng vấn của người phỏng vấn (SECURE: Filter by InterviewerId)
    /// </summary>
    Task<List<MyInterviewDto>> GetMyInterviewScheduleAsync(Guid interviewerId);

    /// <summary>
    /// Get Interview by ApplicationId to retrieve interviewer information (for CC emails)
    /// </summary>
    Task<InterviewWithInterviewerDto?> GetInterviewByApplicationIdAsync(Guid applicationId);
}
