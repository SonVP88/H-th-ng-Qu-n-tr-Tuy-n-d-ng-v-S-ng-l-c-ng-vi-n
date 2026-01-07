using UTC_DATN.DTOs.Ai;

namespace UTC_DATN.Services.Interfaces;

public interface IAiMatchingService
{
    /// <summary>
    /// Đọc text từ file PDF
    /// </summary>
    /// <param name="filePath">Đường dẫn tuyệt đối đến file PDF</param>
    /// <returns>Text đã trích xuất từ PDF</returns>
    Task<string> ExtractTextFromPdfAsync(string filePath);

    /// <summary>
    /// Chấm điểm CV dựa trên Job Description bằng AI
    /// </summary>
    /// <param name="cvText">Nội dung CV đã extract</param>
    /// <param name="jobDescription">Mô tả công việc</param>
    /// <returns>Kết quả chấm điểm</returns>
    Task<AiScoreResult> ScoreApplicationAsync(string cvText, string jobDescription);
}
