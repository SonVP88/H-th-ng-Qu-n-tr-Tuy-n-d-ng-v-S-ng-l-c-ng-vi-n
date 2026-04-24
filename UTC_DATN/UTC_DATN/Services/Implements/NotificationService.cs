using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UTC_DATN.Data;
using UTC_DATN.DTOs;
using UTC_DATN.Entities;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Services.Implements
{
    public class NotificationService : INotificationService
    {
        private readonly UTC_DATNContext _context;

        public NotificationService(UTC_DATNContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<NotificationDto>> GetNotificationsAsync(Guid userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .Where(n => n.Type == null || !n.Type.StartsWith("SLA_"))
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    RelatedId = n.RelatedId
                })
                .ToListAsync();

            await HydrateNotificationDisplayNamesAsync(notifications);
            return notifications;
        }

        private async Task HydrateNotificationDisplayNamesAsync(List<NotificationDto> notifications)
        {
            var applicationIds = notifications
                .Where(n => !string.IsNullOrWhiteSpace(n.RelatedId))
                .Select(n => Guid.TryParse(n.RelatedId, out var id) ? id : Guid.Empty)
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList();

            if (applicationIds.Count == 0)
            {
                return;
            }

            var appLookup = await _context.Applications
                .Where(a => applicationIds.Contains(a.ApplicationId))
                .Select(a => new
                {
                    a.ApplicationId,
                    a.ContactName,
                    CandidateName = a.Candidate != null ? a.Candidate.FullName : null,
                    JobTitle = a.Job != null ? a.Job.Title : null
                })
                .ToDictionaryAsync(a => a.ApplicationId);

            foreach (var notification in notifications)
            {
                if (!Guid.TryParse(notification.RelatedId, out var applicationId))
                {
                    continue;
                }

                if (!appLookup.TryGetValue(applicationId, out var app))
                {
                    continue;
                }

                var displayName = !string.IsNullOrWhiteSpace(app.ContactName)
                    ? app.ContactName.Trim()
                    : !string.IsNullOrWhiteSpace(app.CandidateName)
                        ? app.CandidateName.Trim()
                        : "Ứng viên";

                var jobTitle = string.IsNullOrWhiteSpace(app.JobTitle)
                    ? "vị trí ứng tuyển"
                    : app.JobTitle;

                if (notification.Type == "NEW_APPLICATION")
                {
                    notification.Title = "Có hồ sơ ứng tuyển mới";
                    notification.Message = $"Ứng viên {displayName} vừa nộp hồ sơ vào vị trí {jobTitle}.";
                    continue;
                }

                if (notification.Type == "OFFER")
                {
                    var lowerTitle = notification.Title?.ToLowerInvariant() ?? string.Empty;
                    var lowerMessage = notification.Message?.ToLowerInvariant() ?? string.Empty;

                    if (lowerTitle.Contains("đồng ý") || lowerMessage.Contains("chấp nhận"))
                    {
                        notification.Title = $"{displayName} đã đồng ý nhận việc";
                        notification.Message = $"{displayName} đã CHẤP NHẬN offer cho vị trí \"{jobTitle}\". Vui lòng xác nhận nhận việc để hoàn tất tuyển dụng.";
                        continue;
                    }

                    if (lowerTitle.Contains("từ chối") || lowerMessage.Contains("từ chối"))
                    {
                        notification.Title = $"{displayName} đã từ chối offer";
                        notification.Message = $"{displayName} đã TỪ CHỐI offer cho vị trí \"{jobTitle}\". Bạn có thể xem xét ứng viên khác.";
                    }
                }
            }
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead && (n.Type == null || !n.Type.StartsWith("SLA_")));
        }

        public async Task MarkAsReadAsync(Guid notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .Where(n => n.Type == null || !n.Type.StartsWith("SLA_"))
                .ToListAsync();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task CreateNotificationAsync(Guid userId, string title, string message, string type, string relatedId = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                RelatedId = relatedId
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteNotificationAsync(Guid notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
            }
        }
    }
}
