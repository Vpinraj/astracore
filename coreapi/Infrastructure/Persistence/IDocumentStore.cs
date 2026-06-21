using System.Collections.Generic;
using System.Threading.Tasks;

namespace CoreApi.Infrastructure.Persistence;

public interface IDocumentStore
{
    Task<T?> GetAsync<T>(string collectionName, string id);
    Task SaveAsync<T>(string collectionName, string id, T document);
    Task<IEnumerable<T>> GetAllAsync<T>(string collectionName);
    Task DeleteAsync(string collectionName, string id);
}
