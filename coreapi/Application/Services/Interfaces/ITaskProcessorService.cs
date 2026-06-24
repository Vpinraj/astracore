using System.Threading.Tasks;

namespace CoreApi.Application.Services.Interfaces;

public interface ITaskProcessorService
{
    Task ProcessTaskAsync(string taskId);
}
