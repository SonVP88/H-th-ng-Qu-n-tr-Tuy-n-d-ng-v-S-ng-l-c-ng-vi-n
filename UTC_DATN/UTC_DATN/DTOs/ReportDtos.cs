namespace UTC_DATN.DTOs
{
    /// <summary>
    /// Summary statistics for recruitment dashboard
    /// </summary>
    public class ReportDashboardDto
    {
        /// <summary>
        /// Total number of candidates in the system
        /// </summary>
        public int TotalCandidates { get; set; }

        /// <summary>
        /// Number of candidates hired (Status = HIRED or Offer_Accepted)
        /// </summary>
        public int HiredCount { get; set; }

        /// <summary>
        /// Number of open job positions
        /// </summary>
        public int OpenJobsCount { get; set; }

        /// <summary>
        /// Conversion rate: (Hired / Total) * 100
        /// </summary>
        public double ConversionRate { get; set; }
    }

    /// <summary>
    /// Data for recruitment funnel chart
    /// </summary>
    public class FunnelDataDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Data { get; set; } = new();
    }

    /// <summary>
    /// Data for application source distribution chart
    /// </summary>
    public class SourceDataDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Data { get; set; } = new();
    }

    /// <summary>
    /// Data for monthly application trend chart
    /// </summary>
    public class TrendDataDto
    {
        public List<string> Labels { get; set; } = new();
        public List<int> Data { get; set; } = new();
    }

    /// <summary>
    /// Container for all chart data
    /// </summary>
    public class ReportChartsDto
    {
        public FunnelDataDto FunnelData { get; set; } = new();
        public SourceDataDto SourceData { get; set; } = new();
        public TrendDataDto TrendData { get; set; } = new();
    }
}
