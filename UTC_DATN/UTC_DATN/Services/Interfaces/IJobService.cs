using UTC_DATN.DTOs.Job;

namespace UTC_DATN.Services.Interfaces;

public interface IJobService
{
    Task<bool> CreateJobAsync(CreateJobRequest request, Guid userId);
    
    Task<List<JobHomeDto>> GetLatestJobsAsync(int count);
    
    Task<JobDetailDto?> GetJobByIdAsync(Guid id);
}
