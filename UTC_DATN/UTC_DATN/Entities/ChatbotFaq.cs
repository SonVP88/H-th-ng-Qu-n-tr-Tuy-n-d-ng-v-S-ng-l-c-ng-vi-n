using System;

namespace UTC_DATN.Entities;

public partial class ChatbotFaq
{
    public Guid FaqId { get; set; }

    public string Question { get; set; }

    public string Answer { get; set; }

    public string Category { get; set; }

    public string Keywords { get; set; }

    public int Priority { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Guid? CreatedBy { get; set; }
}