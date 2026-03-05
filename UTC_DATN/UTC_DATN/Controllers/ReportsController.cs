using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using UTC_DATN.DTOs;
using UTC_DATN.Data;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using OfficeOpenXml.Drawing.Chart;
using System.Drawing;

namespace UTC_DATN.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly UTC_DATNContext _context;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(UTC_DATNContext context, ILogger<ReportsController> logger)
    {
        _context = context;
        _logger = logger;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    /// <summary>GET /api/reports/summary</summary>
    [HttpGet("summary")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<ActionResult<ReportDashboardDto>> GetSummary([FromQuery] int? year)
    {
        try
        {
            var targetYear = year ?? DateTime.Now.Year;
            var totalCandidates = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear).Select(a => a.CandidateId).Distinct().CountAsync();
            var hiredCount = await _context.Applications.AsNoTracking()
                .Where(a => a.Status == "HIRED" && a.AppliedAt.Year == targetYear).CountAsync();
            var openJobsCount = await _context.Jobs.AsNoTracking()
                .Where(j => !j.IsDeleted && (j.Status == "ACTIVE" || j.Status == "OPEN")).CountAsync();
            var totalApplications = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear).CountAsync();
            var conversionRate = totalApplications > 0
                ? Math.Round((double)hiredCount / totalApplications * 100, 2) : 0;
            return Ok(new ReportDashboardDto
            {
                TotalCandidates = totalCandidates,
                HiredCount = hiredCount,
                OpenJobsCount = openJobsCount,
                ConversionRate = conversionRate
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching report summary");
            return StatusCode(500, new { message = "Lỗi server khi tải báo cáo" });
        }
    }

    /// <summary>GET /api/reports/charts</summary>
    [HttpGet("charts")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<ActionResult<ReportChartsDto>> GetCharts([FromQuery] int? year)
    {
        try
        {
            var targetYear = year ?? DateTime.Now.Year;
            var result = new ReportChartsDto();
            var statusCounts = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync();
            var funnelStages = new[] { "PENDING", "INTERVIEW", "Pending_Offer", "Offer_Sent", "HIRED" };
            result.FunnelData.Labels = new List<string> { "Ứng tuyển", "Phỏng vấn", "Chờ Offer", "Đã gửi Offer", "Đã tuyển" };
            result.FunnelData.Data = funnelStages
                .Select(stage => statusCounts.FirstOrDefault(s => s.Status == stage)?.Count ?? 0).ToList();
            var sourceCounts = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.Source ?? "Trực tiếp")
                .Select(g => new { Source = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count).Take(5).ToListAsync();
            result.SourceData.Labels = sourceCounts.Select(s => s.Source).ToList();
            result.SourceData.Data = sourceCounts.Select(s => s.Count).ToList();
            var monthlyData = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.AppliedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() }).ToListAsync();
            result.TrendData.Labels = new List<string> { "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12" };
            result.TrendData.Data = Enumerable.Range(1, 12)
                .Select(month => monthlyData.FirstOrDefault(m => m.Month == month)?.Count ?? 0).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching chart data");
            return StatusCode(500, new { message = "Lỗi server khi tải biểu đồ" });
        }
    }

    /// <summary>GET /api/reports/export-excel - Xuất Excel với native chart thật (EPPlus)</summary>
    [HttpGet("export-excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] int? year)
    {
        try
        {
            var targetYear = year ?? DateTime.Now.Year;

            // ===== Lấy dữ liệu =====
            var totalCandidates = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear).Select(a => a.CandidateId).Distinct().CountAsync();
            var hiredCount = await _context.Applications.AsNoTracking()
                .Where(a => a.Status == "HIRED" && a.AppliedAt.Year == targetYear).CountAsync();
            var openJobsCount = await _context.Jobs.AsNoTracking()
                .Where(j => !j.IsDeleted && (j.Status == "ACTIVE" || j.Status == "OPEN")).CountAsync();
            var totalApps = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear).CountAsync();
            var convRate = totalApps > 0 ? Math.Round((double)hiredCount / totalApps * 100, 2) : 0;

            var statusCounts = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.Status).Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync();
            var funnelStages = new[] { "PENDING", "INTERVIEW", "Pending_Offer", "Offer_Sent", "HIRED" };
            var funnelLabels = new[] { "Ứng tuyển", "Phỏng vấn", "Chờ Offer", "Đã gửi Offer", "Đã tuyển" };
            var funnelValues = funnelStages.Select(s => statusCounts.FirstOrDefault(x => x.Status == s)?.Count ?? 0).ToArray();

            var sourceCounts = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.Source ?? "Trực tiếp")
                .Select(g => new { Source = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count).Take(5).ToListAsync();

            var monthlyData = await _context.Applications.AsNoTracking()
                .Where(a => a.AppliedAt.Year == targetYear)
                .GroupBy(a => a.AppliedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() }).ToListAsync();
            var trendValues = Enumerable.Range(1, 12)
                .Select(m => monthlyData.FirstOrDefault(x => x.Month == m)?.Count ?? 0).ToArray();
            var trendLabels = new[] { "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12" };

            // ===== Tạo Excel =====
            using var package = new ExcelPackage();
            var headerColor = Color.FromArgb(26, 86, 219);
            var lightBg = Color.FromArgb(238, 242, 255);

            void ApplyHeader(ExcelRange r)
            {
                r.Style.Font.Bold = true;
                r.Style.Font.Color.SetColor(Color.White);
                r.Style.Fill.PatternType = ExcelFillStyle.Solid;
                r.Style.Fill.BackgroundColor.SetColor(headerColor);
                r.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                r.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                r.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.LightSteelBlue);
            }

            void ApplyData(ExcelRange r, bool odd)
            {
                r.Style.Fill.PatternType = ExcelFillStyle.Solid;
                r.Style.Fill.BackgroundColor.SetColor(odd ? Color.FromArgb(248, 250, 252) : Color.White);
                r.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.LightGray);
                r.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            }

            void MakeSheetTitle(ExcelWorksheet ws, string text, int cols)
            {
                var addr = $"A1:{(char)('A' + cols - 1)}1";
                ws.Cells[addr].Merge = true;
                ws.Cells["A1"].Value = text;
                ws.Cells["A1"].Style.Font.Bold = true; ws.Cells["A1"].Style.Font.Size = 15;
                ws.Cells["A1"].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                ws.Cells["A1"].Style.Fill.PatternType = ExcelFillStyle.Solid;
                ws.Cells["A1"].Style.Fill.BackgroundColor.SetColor(lightBg);
                ws.Row(1).Height = 32;
            }

            // ---- SHEET 1: TỔNG QUAN ----
            var ws1 = package.Workbook.Worksheets.Add("Tổng Quan");
            MakeSheetTitle(ws1, $"BÁO CÁO TUYỂN DỤNG NĂM {targetYear}", 3);
            ApplyHeader(ws1.Cells["A3:C3"]);
            ws1.Cells["A3"].Value = "Chỉ số"; ws1.Cells["B3"].Value = "Giá trị"; ws1.Cells["C3"].Value = "Ghi chú";
            ws1.Row(3).Height = 22;
            var s1Data = new (string label, object val, string note)[]
            {
                ("Tổng ứng viên", totalCandidates, "Tổng số hồ sơ ứng tuyển"),
                ("Đã tuyển", hiredCount, "Trạng thái HIRED"),
                ("Vị trí đang mở", openJobsCount, "Jobs chưa đóng"),
                ("Tỷ lệ tuyển dụng", $"{convRate}%", "Hired / Applications × 100")
            };
            for (int i = 0; i < s1Data.Length; i++)
            {
                ws1.Cells[4 + i, 1].Value = s1Data[i].label;
                ws1.Cells[4 + i, 2].Value = s1Data[i].val;
                ws1.Cells[4 + i, 3].Value = s1Data[i].note;
                ApplyData(ws1.Cells[4 + i, 1, 4 + i, 3], i % 2 == 0);
                ws1.Row(4 + i).Height = 20;
            }
            ws1.Column(1).Width = 28; ws1.Column(2).Width = 18; ws1.Column(3).Width = 36;

            // ---- SHEET 2: PHỄU TUYỂN DỤNG + BAR CHART ----
            var ws2 = package.Workbook.Worksheets.Add("Phễu Tuyển Dụng");
            MakeSheetTitle(ws2, "PHỄU TUYỂN DỤNG", 3);
            ApplyHeader(ws2.Cells["A3:C3"]);
            ws2.Cells["A3"].Value = "Giai đoạn"; ws2.Cells["B3"].Value = "Số ứng viên"; ws2.Cells["C3"].Value = "Tỷ lệ (%)";
            int fTotal = funnelValues.Sum();
            for (int i = 0; i < funnelLabels.Length; i++)
            {
                ws2.Cells[4 + i, 1].Value = funnelLabels[i];
                ws2.Cells[4 + i, 2].Value = funnelValues[i];
                ws2.Cells[4 + i, 3].Value = fTotal > 0 ? Math.Round((double)funnelValues[i] / fTotal * 100, 1) + "%" : "0%";
                ApplyData(ws2.Cells[4 + i, 1, 4 + i, 3], i % 2 == 0);
            }
            ws2.Column(1).Width = 20; ws2.Column(2).Width = 16; ws2.Column(3).Width = 14;

            // Native Bar Chart
            var barChart = ws2.Drawings.AddChart("FunnelChart", eChartType.ColumnClustered) as ExcelBarChart;
            if (barChart != null)
            {
                barChart.Title.Text = "Phễu Tuyển Dụng";
                barChart.Title.Font.Bold = true;
                var ser = barChart.Series.Add(ws2.Cells[4, 2, 3 + funnelLabels.Length, 2], ws2.Cells[4, 1, 3 + funnelLabels.Length, 1]);
                ser.Header = "Số ứng viên";
                barChart.SetPosition(10, 0, 0, 0);
                barChart.SetSize(550, 320);
                barChart.Legend.Remove();
            }

            // ---- SHEET 3: NGUỒN ỨNG VIÊN + PIE CHART ----
            var ws3 = package.Workbook.Worksheets.Add("Nguồn Ứng Viên");
            MakeSheetTitle(ws3, "NGUỒN ỨNG VIÊN", 3);
            ApplyHeader(ws3.Cells["A3:C3"]);
            ws3.Cells["A3"].Value = "Nguồn"; ws3.Cells["B3"].Value = "Số lượng"; ws3.Cells["C3"].Value = "Tỷ lệ (%)";
            int sTotal = sourceCounts.Sum(s => s.Count);
            for (int i = 0; i < sourceCounts.Count; i++)
            {
                ws3.Cells[4 + i, 1].Value = sourceCounts[i].Source;
                ws3.Cells[4 + i, 2].Value = sourceCounts[i].Count;
                ws3.Cells[4 + i, 3].Value = sTotal > 0 ? Math.Round((double)sourceCounts[i].Count / sTotal * 100, 1) + "%" : "0%";
                ApplyData(ws3.Cells[4 + i, 1, 4 + i, 3], i % 2 == 0);
            }
            ws3.Column(1).Width = 24; ws3.Column(2).Width = 14; ws3.Column(3).Width = 14;

            // Native Pie Chart
            if (sourceCounts.Count > 0)
            {
                var pieChart = ws3.Drawings.AddChart("SourceChart", eChartType.Pie) as ExcelPieChart;
                if (pieChart != null)
                {
                    pieChart.Title.Text = "Nguồn Ứng Viên";
                    pieChart.Title.Font.Bold = true;
                    var ser = pieChart.Series.Add(ws3.Cells[4, 2, 3 + sourceCounts.Count, 2], ws3.Cells[4, 1, 3 + sourceCounts.Count, 1]);
                    ser.Header = "Nguồn";
                    pieChart.SetPosition(10, 0, 0, 0);
                    pieChart.SetSize(500, 320);
                    pieChart.Legend.Position = eLegendPosition.Right;
                }
            }

            // ---- SHEET 4: XU HƯỚNG + LINE CHART ----
            var ws4 = package.Workbook.Worksheets.Add("Xu Hướng");
            MakeSheetTitle(ws4, $"XU HƯỚNG ỨNG TUYỂN {targetYear}", 2);
            ApplyHeader(ws4.Cells["A3:B3"]);
            ws4.Cells["A3"].Value = "Tháng"; ws4.Cells["B3"].Value = "Số ứng tuyển";
            for (int i = 0; i < 12; i++)
            {
                ws4.Cells[4 + i, 1].Value = trendLabels[i];
                ws4.Cells[4 + i, 2].Value = trendValues[i];
                ApplyData(ws4.Cells[4 + i, 1, 4 + i, 2], i % 2 == 0);
            }
            ws4.Column(1).Width = 12; ws4.Column(2).Width = 16;

            // Native Line Chart
            var lineChart = ws4.Drawings.AddChart("TrendChart", eChartType.Line) as ExcelLineChart;
            if (lineChart != null)
            {
                lineChart.Title.Text = $"Xu Hướng Ứng Tuyển {targetYear}";
                lineChart.Title.Font.Bold = true;
                var ser = lineChart.Series.Add(ws4.Cells[4, 2, 15, 2], ws4.Cells[4, 1, 15, 1]);
                ser.Header = "Số ứng tuyển";
                lineChart.Smooth = true;
                lineChart.SetPosition(18, 0, 0, 0);
                lineChart.SetSize(600, 320);
                lineChart.Legend.Remove();
            }

            var bytes = await package.GetAsByteArrayAsync();
            var fileName = $"Bao_Cao_Tuyen_Dung_{targetYear}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting Excel");
            return StatusCode(500, new { message = "Lỗi khi xuất Excel: " + ex.Message });
        }
    }
}
