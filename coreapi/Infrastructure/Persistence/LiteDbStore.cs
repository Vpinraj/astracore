using LiteDB;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CoreApi.Infrastructure.Persistence;

public class LiteDbStore : IDocumentStore
{
    private readonly string _dbPath;

    public LiteDbStore(IConfiguration configuration)
    {
        var dbDirectory = Path.Combine(AppContext.BaseDirectory, "data");
        if (!Directory.Exists(dbDirectory))
        {
            Directory.CreateDirectory(dbDirectory);
        }
        _dbPath = Path.Combine(dbDirectory, "astracore.db");
    }

    public Task<T?> GetAsync<T>(string collectionName, string id)
    {
        using var db = new LiteDatabase(_dbPath);
        var col = db.GetCollection<T>(collectionName);
        var doc = col.FindById(id);
        return Task.FromResult<T?>(doc);
    }

    public Task SaveAsync<T>(string collectionName, string id, T document)
    {
        using var db = new LiteDatabase(_dbPath);
        var col = db.GetCollection<T>(collectionName);
        col.Upsert(id, document);
        return Task.CompletedTask;
    }

    public Task<IEnumerable<T>> GetAllAsync<T>(string collectionName)
    {
        using var db = new LiteDatabase(_dbPath);
        var col = db.GetCollection<T>(collectionName);
        return Task.FromResult<IEnumerable<T>>(col.FindAll().ToList());
    }

    public Task DeleteAsync(string collectionName, string id)
    {
        using var db = new LiteDatabase(_dbPath);
        var col = db.GetCollection(collectionName);
        col.Delete(id);
        return Task.CompletedTask;
    }
}
