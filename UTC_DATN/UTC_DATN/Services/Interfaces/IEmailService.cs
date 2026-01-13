namespace UTC_DATN.Services.Interfaces;

public interface IEmailService
{
    /// <summary>
    /// Gửi email
    /// </summary>
    /// <param name="toEmail">Email người nhận</param>
    /// <param name="subject">Tiêu đề email</param>
    /// <param name="body">Nội dung email (HTML)</param>
    Task SendEmailAsync(string toEmail, string subject, string body);
}
