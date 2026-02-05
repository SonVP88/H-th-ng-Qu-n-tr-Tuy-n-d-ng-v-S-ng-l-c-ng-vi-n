namespace UTC_DATN.DTOs.Interview;

/// <summary>
/// DTO cho danh sách Interviewer (dùng cho dropdown)
/// Bao gồm INTERVIEWER, HR_MANAGER, ADMIN
/// </summary>
public class InterviewerListItemDto
{
    public Guid Id { get; set; }
    
    public string FullName { get; set; } = null!;
    
    public string Email { get; set; } = null!;
    
    public string RoleName { get; set; } = null!;
}
