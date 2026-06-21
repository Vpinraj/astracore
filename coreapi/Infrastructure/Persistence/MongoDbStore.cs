using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CoreApi.Infrastructure.Persistence;

public class MongoDbStore : IDocumentStore
{
    private readonly IMongoDatabase _database;

    public MongoDbStore(IConfiguration configuration)
    {
        var connectionString = configuration.GetValue<string>("DatabaseSettings:MongoConnectionString") ?? "mongodb://localhost:27017";
        var databaseName = configuration.GetValue<string>("DatabaseSettings:MongoDatabaseName") ?? "AstraCoreDb";
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public async Task<T?> GetAsync<T>(string collectionName, string id)
    {
        var col = _database.GetCollection<T>(collectionName);
        var filter = Builders<T>.Filter.Eq("Id", id);
        return await col.Find(filter).FirstOrDefaultAsync();
    }

    public async Task SaveAsync<T>(string collectionName, string id, T document)
    {
        var col = _database.GetCollection<T>(collectionName);
        var filter = Builders<T>.Filter.Eq("Id", id);
        await col.ReplaceOneAsync(filter, document, new ReplaceOptions { IsUpsert = true });
    }

    public async Task<IEnumerable<T>> GetAllAsync<T>(string collectionName)
    {
        var col = _database.GetCollection<T>(collectionName);
        return await col.Find(Builders<T>.Filter.Empty).ToListAsync();
    }

    public async Task DeleteAsync(string collectionName, string id)
    {
        var col = _database.GetCollection<MongoDB.Bson.BsonDocument>(collectionName);
        var filter = Builders<MongoDB.Bson.BsonDocument>.Filter.Eq("_id", id);
        await col.DeleteOneAsync(filter);
    }
}
