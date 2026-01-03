using UTC_DATN.Entities;

namespace UTC_DATN.Services.Interfaces
{
    /// <summary>
    /// Service để lấy Master Data cho các dropdown
    /// </summary>
    public interface IMasterDataService
    {
        /// <summary>
        /// Lấy toàn bộ danh sách Skills
        /// </summary>
        /// <returns>Danh sách Skills</returns>
        Task<List<Skill>> GetAllSkillsAsync();

        /// <summary>
        /// Lấy toàn bộ danh sách JobTypes
        /// </summary>
        /// <returns>Danh sách JobTypes</returns>
        Task<List<JobType>> GetAllJobTypesAsync();
    }
}
