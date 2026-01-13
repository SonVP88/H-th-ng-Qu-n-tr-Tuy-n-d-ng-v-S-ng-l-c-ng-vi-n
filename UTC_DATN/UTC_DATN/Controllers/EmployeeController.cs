using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UTC_DATN.DTOs.Employee;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")] // Chỉ ADMIN mới được access
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        /// <summary>
        /// Lấy danh sách nhân viên (HR và INTERVIEWER)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _employeeService.GetEmployeesAsync();
            return Ok(employees);
        }

        /// <summary>
        /// Tạo nhân viên mới (HR hoặc INTERVIEWER)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var employee = await _employeeService.CreateEmployeeAsync(request);

            if (employee == null)
            {
                return BadRequest(new { message = "Có lỗi xảy ra khi tạo nhân viên" });
            }

            return CreatedAtAction(nameof(GetEmployees), new { id = employee.UserId }, employee);
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> DeactivateEmployee(Guid id)
        {
            var result = await _employeeService.DeactivateEmployeeAsync(id);
            
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            return Ok(new { message = "Vô hiệu hóa nhân viên thành công" });
        }

        [HttpPut("{id}/reactivate")]
        public async Task<IActionResult> ReactivateEmployee(Guid id)
        {
            var result = await _employeeService.ReactivateEmployeeAsync(id);
            
            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            return Ok(new { message = "Kích hoạt nhân viên thành công" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] CreateEmployeeRequest request)
        {
            var employee = await _employeeService.UpdateEmployeeAsync(id, request);
            
            if (employee == null)
            {
                return BadRequest(new { message = "Email đã tồn tại hoặc dữ liệu không hợp lệ" });
            }

            return Ok(employee);
        }
    }
}
