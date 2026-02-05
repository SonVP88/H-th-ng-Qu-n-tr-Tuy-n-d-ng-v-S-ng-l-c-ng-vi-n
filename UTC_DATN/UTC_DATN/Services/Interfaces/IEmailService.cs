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

    /// <summary>
    /// Gửi email với CC (đồng kính gửi)
    /// </summary>
    /// <param name="toEmail">Email người nhận chính</param>
    /// <param name="ccEmails">Danh sách email CC</param>
    /// <param name="subject">Tiêu đề email</param>
    /// <param name="body">Nội dung email (HTML)</param>
    Task SendEmailWithCcAsync(string toEmail, List<string> ccEmails, string subject, string body);
}
