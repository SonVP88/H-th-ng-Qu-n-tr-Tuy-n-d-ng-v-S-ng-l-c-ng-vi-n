using Microsoft.EntityFrameworkCore;
using UTC_DATN.Data;
using UTC_DATN.Entities;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Services.Implements
{
    public class MasterDataService : IMasterDataService
    {
        private readonly UTC_DATNContext _context;

        public MasterDataService(UTC_DATNContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy toàn bộ danh sách Skills từ database
        /// </summary>
        /// <returns>Danh sách Skills</returns>
        public async Task<List<Skill>> GetAllSkillsAsync()
        {
            return await _context.Skills
                .AsNoTracking()
                .ToListAsync();
        }

        /// <summary>
        /// Lấy toàn bộ danh sách JobTypes từ database
        /// </summary>
        /// <returns>Danh sách JobTypes</returns>
        public async Task<List<JobType>> GetAllJobTypesAsync()
        {
            return await _context.JobTypes
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
