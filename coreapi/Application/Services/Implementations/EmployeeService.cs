using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class EmployeeService : IEmployeeService
{
    private readonly IRepository<Employee> _employeeRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;

    public EmployeeService(
        IRepository<Employee> employeeRepository,
        IRepository<Subsidiary> subsidiaryRepository)
    {
        _employeeRepository = employeeRepository;
        _subsidiaryRepository = subsidiaryRepository;
    }

    public async Task<Employee> CreateEmployeeAsync(
        string name,
        string designation,
        string department,
        string subsidiaryId,
        string email = "",
        string phone = "",
        double salary = 0,
        string joinDate = "",
        string reportsToId = "",
        string reportsToName = "",
        string avatar = "👤",
        string status = "Active")
    {
        var sub = await _subsidiaryRepository.GetByIdAsync(subsidiaryId);
        string subName = sub?.Name ?? subsidiaryId;

        string timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var employee = new Employee
        {
            Id = $"emp-{timestamp}-{new Random().Next(1000, 9999)}",
            Name = name,
            Designation = designation,
            Department = department,
            SubsidiaryId = subsidiaryId,
            SubsidiaryName = subName,
            Email = email,
            Phone = phone,
            Salary = salary,
            JoinDate = string.IsNullOrWhiteSpace(joinDate)
                ? DateTimeOffset.UtcNow.ToString("yyyy-MM-dd")
                : joinDate,
            Status = status,
            ReportsToId = reportsToId,
            ReportsToName = reportsToName,
            Avatar = string.IsNullOrWhiteSpace(avatar) ? "👤" : avatar
        };

        await _employeeRepository.SaveAsync(employee);
        return employee;
    }

    public async Task<IEnumerable<Employee>> GetAllAsync()
    {
        return (await _employeeRepository.GetAllAsync())
            .OrderBy(e => e.SubsidiaryId)
            .ThenBy(e => e.Department)
            .ThenBy(e => e.Name);
    }

    public async Task DeleteAsync(string employeeId)
    {
        await _employeeRepository.DeleteAsync(employeeId);
    }

    public async Task ClearAllAsync()
    {
        var all = await _employeeRepository.GetAllAsync();
        foreach (var emp in all)
            await _employeeRepository.DeleteAsync(emp.Id);
    }
}
