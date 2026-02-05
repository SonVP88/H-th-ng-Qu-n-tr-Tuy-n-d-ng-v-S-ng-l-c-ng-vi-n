using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UTC_DATN.DTOs;
using UTC_DATN.Data;

namespace UTC_DATN.Controllers;

[ApiController]
[Route("api/reports")]
// [Authorize(Roles = "HR,ADMIN")] // Temporarily disabled for debugging
public class ReportsController : ControllerBase
{
    private readonly UTC_DATNContext _context;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(UTC_DATNContext context, ILogger<ReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/reports/summary - Dashboard summary statistics
    /// </summary>
    [HttpGet("summary")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)] // Cache 5 minutes
    public async Task<ActionResult<ReportDashboardDto>> GetSummary([FromQuery] int? year)
    {
        try
        {
            var targetYear = year ?? DateTime.Now.Year;

            // Total candidates (unique applications) for the year
            var totalCandidates = await _context.Applications
                .AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .Select(a => a.CandidateId)
                .Distinct()
                .CountAsync();

            // Hired count (Status = HIRED) for the year
            var hiredCount = await _context.Applications
                .AsNoTracking()
                .Where(a => a.Status == "HIRED" && a.AppliedAt.Year == targetYear)
                .CountAsync();

            // Open jobs (Status = ACTIVE/OPEN and not deleted)
            var openJobsCount = await _context.Jobs
                .AsNoTracking()
                .Where(j => !j.IsDeleted && (j.Status == "ACTIVE" || j.Status == "OPEN"))
                .CountAsync();

            // Total applications for the year (for conversion rate calculation)
            var totalApplications = await _context.Applications
                .AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .CountAsync();

            // Conversion rate: (Hired / Total Applications) * 100
            var conversionRate = totalApplications > 0 
                ? Math.Round((double)hiredCount / totalApplications * 100, 2) 
                : 0;

            var result = new ReportDashboardDto
            {
                TotalCandidates = totalCandidates,
                HiredCount = hiredCount,
                OpenJobsCount = openJobsCount,
                ConversionRate = conversionRate
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching report summary");
            return StatusCode(500, new { message = "Lỗi server khi tải báo cáo" });
        }
    }

    /// <summary>
    /// GET /api/reports/charts - Chart data for funnel, sources, and trends
    /// </summary>
    [HttpGet("charts")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)] // Cache 5 minutes
    public async Task<ActionResult<ReportChartsDto>> GetCharts([FromQuery] int? year)
    {
        try
        {
            var targetYear = year ?? DateTime.Now.Year;
            var result = new ReportChartsDto();

            // 1. FUNNEL DATA - Applications by status for the year
            var statusCounts = await _context.Applications
                .AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            // Define funnel order
            var funnelStages = new[] { "PENDING", "INTERVIEW", "Pending_Offer", "Offer_Sent", "HIRED" };
            result.FunnelData.Labels = new List<string> { "Ứng tuyển", "Phỏng vấn", "Chờ Offer", "Đã gửi Offer", "Đã tuyển" };
            result.FunnelData.Data = funnelStages
                .Select(stage => statusCounts.FirstOrDefault(s => s.Status == stage)?.Count ?? 0)
                .ToList();

            // 2. SOURCE DATA - Applications by source for the year
            var sourceCounts = await _context.Applications
                .AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.Source ?? "Trực tiếp")
                .Select(g => new { Source = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToListAsync();

            result.SourceData.Labels = sourceCounts.Select(s => s.Source).ToList();
            result.SourceData.Data = sourceCounts.Select(s => s.Count).ToList();

            // 3. TREND DATA - Applications by month for the year
            var monthlyData = await _context.Applications
                .AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.AppliedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            result.TrendData.Labels = new List<string> 
            { 
                "T1", "T2", "T3", "T4", "T5", "T6", 
                "T7", "T8", "T9", "T10", "T11", "T12" 
            };
            result.TrendData.Data = Enumerable.Range(1, 12)
                .Select(month => monthlyData.FirstOrDefault(m => m.Month == month)?.Count ?? 0)
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching chart data");
            return StatusCode(500, new { message = "Lỗi server khi tải biểu đồ" });
        }
    }
}
