namespace UTC_DATN.DTOs;

/// <summary>
/// DTO for Interview with Interviewer information (for CC emails)
/// </summary>
public class InterviewWithInterviewerDto
{
    public Guid InterviewId { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid InterviewerId { get; set; }
    public string? InterviewerEmail { get; set; }
    public string? InterviewerName { get; set; }
    public DateTime ScheduledStart { get; set; }
    public string? Status { get; set; }
}
