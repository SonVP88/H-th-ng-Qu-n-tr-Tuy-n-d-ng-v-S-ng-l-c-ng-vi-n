using Microsoft.EntityFrameworkCore;
using UTC_DATN.Data;
using UTC_DATN.DTOs.Job;
using UTC_DATN.Entities;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Services.Implements;

public class JobService : IJobService
{
    private readonly UTC_DATNContext _context;

    public JobService(UTC_DATNContext context)
    {
        _context = context;
    }

    public async Task<bool> CreateJobAsync(CreateJobRequest request, Guid userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Tạo mã Code duy nhất
            var jobCode = await GenerateUniqueJobCodeAsync();

            // Tạo object Job mới
            var job = new Job
            {
                JobId = Guid.NewGuid(),
                Code = jobCode,
                Title = request.Title,
                Description = request.Description,
                SalaryMin = request.SalaryMin,
                SalaryMax = request.SalaryMax,
                Location = request.Location,
                EmploymentType = request.EmploymentType,
                ClosedAt = request.Deadline,
                CreatedBy = userId,
                Status = "OPEN",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            // Xử lý JobSkillMap
            if (request.SkillIds != null && request.SkillIds.Any())
            {
                foreach (var skillId in request.SkillIds)
                {
                    var jobSkillMap = new JobSkillMap
                    {
                        JobId = job.JobId,
                        SkillId = skillId,
                        Weight = 1 // Mặc định Weight = 1
                    };
                    job.JobSkillMaps.Add(jobSkillMap);
                }
            }

            // Lưu vào DB
            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            // Commit transaction
            await transaction.CommitAsync();

            return true;
        }
        catch (Exception)
        {
            // Rollback nếu có lỗi
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Sinh mã Code duy nhất theo format: JOB-{yyyyMMdd}-{RandomString}
    /// </summary>
    private async Task<string> GenerateUniqueJobCodeAsync()
    {
        string code;
        bool isUnique;

        do
        {
            // Tạo mã theo format JOB-{yyyyMMdd}-{RandomString}
            var datePart = DateTime.Now.ToString("yyyyMMdd");
            var randomPart = GenerateRandomString(6);
            code = $"JOB-{datePart}-{randomPart}";

            // Kiểm tra xem mã đã tồn tại chưa
            isUnique = !await _context.Jobs.AnyAsync(j => j.Code == code);
        }
        while (!isUnique);

        return code;
    }

    /// <summary>
    /// Sinh chuỗi ngẫu nhiên gồm chữ và số
    /// </summary>
    private string GenerateRandomString(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// Lấy danh sách job mới nhất để hiển thị trên trang chủ
    /// </summary>
    public async Task<List<JobHomeDto>> GetLatestJobsAsync(int count)
    {
        var jobs = await _context.Jobs
            .Where(j => !j.IsDeleted && j.Status == "OPEN") // Chỉ lấy job đang mở và chưa xóa
            .Include(j => j.JobSkillMaps)
                .ThenInclude(jsm => jsm.Skill) // Include Skills
            .Include(j => j.CreatedByNavigation) // Include User để lấy CompanyName
            .OrderByDescending(j => j.CreatedAt) // Mới nhất lên đầu
            .Take(count) // Lấy số lượng yêu cầu
            .ToListAsync();

        // Map sang DTO
        var result = jobs.Select(j => new JobHomeDto
        {
            JobId = j.JobId,
            Title = j.Title,
            CompanyName = j.CreatedByNavigation?.FullName ?? "Unknown Company",
            SalaryMin = j.SalaryMin,
            SalaryMax = j.SalaryMax,
            Location = j.Location,
            EmploymentType = j.EmploymentType,
            Deadline = j.ClosedAt,
            CreatedDate = j.CreatedAt,
            Skills = j.JobSkillMaps.Select(jsm => jsm.Skill.Name).ToList()
        }).ToList();

        return result;
    }

    /// <summary>
    /// Lấy chi tiết job theo ID
    /// </summary>
    public async Task<JobDetailDto?> GetJobByIdAsync(Guid id)
    {
        Console.WriteLine($"[DEBUG] Searching for job ID: {id}");
        
        // Tạm bỏ Include để test
        var job = await _context.Jobs
            .Where(j => j.JobId == id && !j.IsDeleted)
            .FirstOrDefaultAsync();

        Console.WriteLine($"[DEBUG] Found job: {(job != null ? job.Title : "NULL")}");
        
        if (job == null)
        {
            Console.WriteLine($"[DEBUG] Job not found or IsDeleted = true");
            return null;
        }

        // Load navigation properties separately
        await _context.Entry(job)
            .Collection(j => j.JobSkillMaps)
            .Query()
            .Include(jsm => jsm.Skill)
            .LoadAsync();
            
        await _context.Entry(job)
            .Reference(j => j.CreatedByNavigation)
            .LoadAsync();

        Console.WriteLine($"[DEBUG] Loaded {job.JobSkillMaps.Count} skills");
        Console.WriteLine($"[DEBUG] CreatedBy: {job.CreatedByNavigation?.FullName ?? "NULL"}");

        // Map sang DTO
        var result = new JobDetailDto
        {
            JobId = job.JobId,
            Title = job.Title,
            CompanyName = job.CreatedByNavigation?.FullName ?? "Unknown Company",
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            Location = job.Location,
            EmploymentType = job.EmploymentType,
            Deadline = job.ClosedAt,
            CreatedDate = job.CreatedAt,
            Skills = job.JobSkillMaps.Select(jsm => jsm.Skill.Name).ToList(),
            
            // Thông tin chi tiết
            Description = job.Description,
            Requirements = null, // Entity không có field này
            Benefits = null, // Entity không có field này
            ContactEmail = job.CreatedByNavigation?.Email,
            NumberOfPositions = null // Entity không có field này
        };

        Console.WriteLine($"[DEBUG] Returning DTO for job: {result.Title}");
        return result;
    }
}
