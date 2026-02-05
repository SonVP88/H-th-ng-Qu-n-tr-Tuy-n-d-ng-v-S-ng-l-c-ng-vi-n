using System.Net;
using System.Net.Mail;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Services.Implements;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            // Lấy cấu hình SMTP từ appsettings.json
            var host = _configuration["SmtpSettings:Host"] ?? "smtp.gmail.com";
            var port = int.Parse(_configuration["SmtpSettings:Port"] ?? "587");
            var enableSsl = bool.Parse(_configuration["SmtpSettings:EnableSsl"] ?? "true");
            var userName = _configuration["SmtpSettings:UserName"];
            var appPassword = _configuration["SmtpSettings:AppPassword"];
            var fromName = _configuration["SmtpSettings:FromName"] ?? "Job Portal";
            var fromEmail = _configuration["SmtpSettings:FromEmail"];

            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(appPassword))
            {
                _logger.LogWarning("SMTP credentials not configured. Email will not be sent.");
                return;
            }

            _logger.LogInformation("📧 Đang gửi email đến: {ToEmail}, Subject: {Subject}", toEmail, subject);

            // Tạo MailMessage
            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail ?? userName, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            // Cấu hình SMTP Client
            using var smtpClient = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(userName, appPassword),
                EnableSsl = enableSsl
            };

            // Gửi email
            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("✅ Đã gửi email thành công đến: {ToEmail}", toEmail);
        }
        catch (SmtpException smtpEx)
        {
            _logger.LogError(smtpEx, "❌ Lỗi SMTP khi gửi email đến: {ToEmail}. Error: {Message}", toEmail, smtpEx.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Lỗi khi gửi email đến: {ToEmail}", toEmail);
            throw;
        }
    }

    public async Task SendEmailWithCcAsync(string toEmail, List<string> ccEmails, string subject, string body)
    {
        try
        {
            // Lấy cấu hình SMTP từ appsettings.json
            var host = _configuration["SmtpSettings:Host"] ?? "smtp.gmail.com";
            var port = int.Parse(_configuration["SmtpSettings:Port"] ?? "587");
            var enableSsl = bool.Parse(_configuration["SmtpSettings:EnableSsl"] ?? "true");
            var userName = _configuration["SmtpSettings:UserName"];
            var appPassword = _configuration["SmtpSettings:AppPassword"];
            var fromName = _configuration["SmtpSettings:FromName"] ?? "V9 TECH Recruitment";
            var fromEmail = _configuration["SmtpSettings:FromEmail"];

            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(appPassword))
            {
                _logger.LogWarning("SMTP credentials not configured. Email will not be sent.");
                return;
            }

            _logger.LogInformation("📧 Đang gửi email đến: {ToEmail} với {CcCount} CC, Subject: {Subject}", 
                toEmail, ccEmails?.Count ?? 0, subject);

            // Tạo MailMessage
            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail ?? userName, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(toEmail);

            // Thêm CC
            if (ccEmails != null && ccEmails.Any())
            {
                foreach (var ccEmail in ccEmails.Where(e => !string.IsNullOrWhiteSpace(e)))
                {
                    mailMessage.CC.Add(ccEmail);
                }
            }

            // Cấu hình SMTP Client
            using var smtpClient = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(userName, appPassword),
                EnableSsl = enableSsl
            };

            // Gửi email
            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("✅ Đã gửi email thành công đến: {ToEmail} (CC: {CcCount})", 
                toEmail, mailMessage.CC.Count);
        }
        catch (SmtpException smtpEx)
        {
            _logger.LogError(smtpEx, "❌ Lỗi SMTP khi gửi email đến: {ToEmail}. Error: {Message}", toEmail, smtpEx.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Lỗi khi gửi email đến: {ToEmail}", toEmail);
            throw;
        }
    }
}
