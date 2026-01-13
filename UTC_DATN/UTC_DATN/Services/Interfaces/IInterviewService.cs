using UTC_DATN.DTOs.Interview;

namespace UTC_DATN.Services.Interfaces;

public interface IInterviewService
{
    /// <summary>
    /// Submit kết quả đánh giá phỏng vấn
    /// Tự động cập nhật trạng thái Application dựa trên Result
    /// </summary>
    Task<Guid> SubmitEvaluationAsync(EvaluationDto dto);
}
