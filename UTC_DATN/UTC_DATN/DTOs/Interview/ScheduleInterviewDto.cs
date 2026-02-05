using System.ComponentModel.DataAnnotations;

namespace UTC_DATN.DTOs.Interview;

/// <summary>
/// DTO cho việc lên lịch phỏng vấn
/// </summary>
public class ScheduleInterviewDto
{
    [Required(ErrorMessage = "ApplicationId là bắt buộc")]
    public Guid ApplicationId { get; set; }

    [Required(ErrorMessage = "InterviewerId là bắt buộc")]
    public Guid InterviewerId { get; set; }

    [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
    [StringLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự")]
    public string Title { get; set; } = null!;

    [Required(ErrorMessage = "Thời gian bắt đầu là bắt buộc")]
    public DateTime ScheduledStart { get; set; }

    [Required(ErrorMessage = "Thời gian kết thúc là bắt buộc")]
    public DateTime ScheduledEnd { get; set; }

    [StringLength(500, ErrorMessage = "Link meeting không được vượt quá 500 ký tự")]
    public string? MeetingLink { get; set; }

    [StringLength(300, ErrorMessage = "Địa điểm không được vượt quá 300 ký tự")]
    public string? Location { get; set; }
}
