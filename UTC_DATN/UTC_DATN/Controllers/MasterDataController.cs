using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Controllers
{
    [Route("api/master-data")] // Đổi từ [controller] sang master-data
    [ApiController]
    [AllowAnonymous] // Cho phép truy cập không cần authentication
    public class MasterDataController : ControllerBase
    {
        private readonly IMasterDataService _masterDataService;

        public MasterDataController(IMasterDataService masterDataService)
        {
            _masterDataService = masterDataService;
        }

        /// <summary>
        /// Lấy danh sách tất cả Skills để hiển thị trên dropdown
        /// </summary>
        /// <returns>Danh sách Skills</returns>
        [HttpGet("skills")]
        public async Task<IActionResult> GetSkills()
        {
            try
            {
                var skills = await _masterDataService.GetAllSkillsAsync();
                return Ok(skills);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách Skills", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả JobTypes để hiển thị trên dropdown
        /// </summary>
        /// <returns>Danh sách JobTypes</returns>
        [HttpGet("job-types")]
        public async Task<IActionResult> GetJobTypes()
        {
            try
            {
                var jobTypes = await _masterDataService.GetAllJobTypesAsync();
                return Ok(jobTypes);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách JobTypes", error = ex.Message });
            }
        }
    }
}
