using System.Threading.Tasks;
using CoreApi.Core.Entities;

namespace CoreApi.Application.Services.Interfaces;

public interface ISimulationEngine
{
    Task<SimulationState> GetStateAsync();
    Task SaveStateAsync(SimulationState state);
    Task<SimulationState> ResetStateAsync();
    Task<SimulationState> TickAsync();
}
