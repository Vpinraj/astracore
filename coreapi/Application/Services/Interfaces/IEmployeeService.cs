using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface IEmployeeService
{
    Task<Employee> CreateEmployeeAsync(
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
        string status = "Active"
    );
    Task<IEnumerable<Employee>> GetAllAsync();
    Task DeleteAsync(string employeeId);
    Task ClearAllAsync();
}
