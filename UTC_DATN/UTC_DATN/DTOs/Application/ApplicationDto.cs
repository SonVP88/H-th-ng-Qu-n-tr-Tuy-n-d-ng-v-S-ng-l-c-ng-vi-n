namespace UTC_DATN.DTOs.Application;

public class ApplicationDto
{
    public Guid ApplicationId { get; set; }
    public string CandidateName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public DateTime AppliedAt { get; set; }
    public string CvUrl { get; set; }
    public string Status { get; set; }

    // Thông tin AI Scoring
    public int? MatchScore { get; set; }
    public string? AiExplanation { get; set; }
}
