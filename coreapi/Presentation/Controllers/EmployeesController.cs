using Microsoft.AspNetCore.Mvc;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.DTOs;
using System.Threading.Tasks;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var employees = await _employeeService.GetAllAsync();
        return Ok(employees);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest req)
    {
        var emp = await _employeeService.CreateEmployeeAsync(
            req.Name,
            req.Designation,
            req.Department,
            req.SubsidiaryId,
            req.Email,
            req.Phone,
            req.Salary,
            req.JoinDate,
            req.ReportsToId,
            req.ReportsToName,
            req.Avatar,
            req.Status
        );
        return Ok(emp);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _employeeService.DeleteAsync(id);
        return Ok(new { message = "Employee removed." });
    }
}
