namespace UTC_DATN.DTOs.Ai;

/// <summary>
/// Kết quả chấm điểm CV bởi AI
/// </summary>
public class AiScoreResult
{
    /// <summary>
    /// Điểm số từ 0-100
    /// </summary>
    public int Score { get; set; }

    /// <summary>
    /// Giải thích ngắn gọn về điểm số
    /// </summary>
    public string Explanation { get; set; } = string.Empty;

    /// <summary>
    /// Danh sách kỹ năng còn thiếu
    /// </summary>
    public List<string> MissingSkills { get; set; } = new List<string>();

    /// <summary>
    /// Danh sách kỹ năng phù hợp
    /// </summary>
    public List<string> MatchedSkills { get; set; } = new List<string>();
}
