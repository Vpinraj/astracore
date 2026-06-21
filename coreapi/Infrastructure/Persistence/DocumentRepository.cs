using System.Collections.Generic;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;

namespace CoreApi.Infrastructure.Persistence;

public class DocumentRepository<T> : IRepository<T> where T : class, IEntity
{
    private readonly IDocumentStore _documentStore;
    private readonly string _collectionName;

    public DocumentRepository(IDocumentStore documentStore, string collectionName)
    {
        _documentStore = documentStore;
        _collectionName = collectionName;
    }

    public Task<T?> GetByIdAsync(string id)
    {
        return _documentStore.GetAsync<T>(_collectionName, id);
    }

    public Task<IEnumerable<T>> GetAllAsync()
    {
        return _documentStore.GetAllAsync<T>(_collectionName);
    }

    public Task SaveAsync(T entity)
    {
        return _documentStore.SaveAsync(_collectionName, entity.Id, entity);
    }

    public Task DeleteAsync(string id)
    {
        return _documentStore.DeleteAsync(_collectionName, id);
    }
}
