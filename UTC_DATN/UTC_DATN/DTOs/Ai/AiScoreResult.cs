namespace UTC_DATN.DTOs.Ai;

/// <summary>
/// Kết quả chấm điểm CV bởi AI
/// </summary>
public class AiScoreResult
{
    /// <summary>Điểm số tổng từ 0-100</summary>
    public int Score { get; set; }

    /// <summary>Giải thích ngắn gọn về điểm số</summary>
    public string Explanation { get; set; } = string.Empty;

    /// <summary>Danh sách kỹ năng còn thiếu</summary>
    public List<string> MissingSkills { get; set; } = new List<string>();

    /// <summary>Danh sách kỹ năng phù hợp</summary>
    public List<string> MatchedSkills { get; set; } = new List<string>();

    /// <summary>Breakdown điểm theo 4 tiêu chí (Explainable AI)</summary>
    public AiScoreBreakdown? Breakdown { get; set; }
}

/// <summary>
/// Phân tích điểm chi tiết theo từng tiêu chí – dùng cho Radar Chart (Explainable AI)
/// </summary>
public class AiScoreBreakdown
{
    /// <summary>Kỹ năng kỹ thuật (0-100)</summary>
    public int TechnicalSkills { get; set; }

    /// <summary>Kinh nghiệm làm việc (0-100)</summary>
    public int Experience { get; set; }

    /// <summary>Trình độ học vấn (0-100)</summary>
    public int Education { get; set; }

    /// <summary>Kỹ năng mềm (0-100)</summary>
    public int SoftSkills { get; set; }
}
