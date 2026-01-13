using System;
using System.Collections.Generic;

namespace UTC_DATN.Entities;

public partial class InterviewEvaluation
{
    public Guid EvaluationId { get; set; }

    public Guid InterviewId { get; set; }

    public Guid InterviewerId { get; set; }

    public int Score { get; set; }

    public string? Comment { get; set; }

    public string Result { get; set; } = null!;

    /// <summary>
    /// Chi tiết từng câu hỏi dạng JSON
    /// Cấu trúc: [{ "question": "...", "answerNote": "...", "score": 8, "aiAssessment": "..." }]
    /// </summary>
    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Interview Interview { get; set; } = null!;

    public virtual User Interviewer { get; set; } = null!;
}
