using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.Services.Implementations;
using coreapi.Infrastructure.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CoreApi.Presentation.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly IRepository<CatalogItem> _catalogRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly IKernelProviderService _kernelProviderService;
    private readonly ILogService _logService;

    public CatalogController(
        IRepository<CatalogItem> catalogRepository,
        IRepository<Subsidiary> subsidiaryRepository,
        IKernelProviderService kernelProviderService,
        ILogService logService)
    {
        _catalogRepository = catalogRepository;
        _subsidiaryRepository = subsidiaryRepository;
        _kernelProviderService = kernelProviderService;
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CatalogItem>>> GetCatalog()
    {
        var items = await _catalogRepository.GetAllAsync();
        return Ok(items.OrderBy(i => i.ProductName));
    }

    [HttpPost]
    public async Task<ActionResult<CatalogItem>> AddItem([FromBody] CatalogItem item)
    {
        if (item == null || string.IsNullOrWhiteSpace(item.ProductName))
        {
            return BadRequest("Invalid product catalog item");
        }

        if (string.IsNullOrWhiteSpace(item.Id))
        {
            item.Id = $"prod-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        }

        await _catalogRepository.SaveAsync(item);
        return Ok(item);
    }

    [HttpPost("clear")]
    public async Task<IActionResult> ClearCatalog()
    {
        var items = await _catalogRepository.GetAllAsync();
        foreach (var item in items)
        {
            await _catalogRepository.DeleteAsync(item.Id);
        }
        return Ok(new { success = true });
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCatalog(
        [FromForm] IFormFile file,
        [FromForm] string subsidiaryId,
        [FromForm] string agentId)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded or file is empty.");
        }

        var subsidiary = await _subsidiaryRepository.GetByIdAsync(subsidiaryId ?? "common");
        var subName = subsidiary?.Name ?? "Common HQ";

        string extractedText = string.Empty;
        bool isImage = false;
        byte[]? imageBytes = null;

        var ext = Path.GetExtension(file.FileName).ToLower();

        if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp")
        {
            isImage = true;
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            imageBytes = ms.ToArray();
        }
        else if (ext == ".docx")
        {
            using var stream = file.OpenReadStream();
            extractedText = DocumentParserHelper.ParseDocx(stream);
        }
        else if (ext == ".xlsx" || ext == ".xls")
        {
            using var stream = file.OpenReadStream();
            extractedText = DocumentParserHelper.ParseXlsx(stream);
        }
        else
        {
            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
            extractedText = await reader.ReadToEndAsync();
        }

        // Set up the LLM Kernel
        var modelId = "gemini-2.0-flash";
        var kernel = _kernelProviderService.CreateKernel(modelId, subsidiaryId);
        var chatService = kernel.GetRequiredService<IChatCompletionService>();

        var systemPrompt = @"You are a Product Catalog Extraction assistant.
Extract a list of products from the provided text or image.
Ensure you return ONLY a valid, raw JSON array of objects, with no markdown formatting, no backticks (e.g. do NOT wrap in ```json), and no other text.
Each object must have these exact properties:
- productName (string)
- description (string)
- price (number)
- sku (string)
- category (string)

If the data lacks a SKU, generate a unique alphanumeric SKU.
If it lacks a category, categorize it logically.
If it lacks a description, write a short, professional description.
Example output:
[
  { ""productName"": ""Wireless Mouse"", ""description"": ""Ergonomic wireless mouse"", ""price"": 899.00, ""sku"": ""SKU-WLMSE1"", ""category"": ""Electronics"" }
]";

        var chat = new ChatHistory(systemPrompt);

        if (isImage && imageBytes != null)
        {
            var msg = new ChatMessageContent(AuthorRole.User, (string?)null);
            msg.Items.Add(new TextContent("Please extract the catalog items from this receipt / document image:"));
            msg.Items.Add(new ImageContent(new ReadOnlyMemory<byte>(imageBytes), "image/jpeg"));
            chat.Add(msg);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(extractedText))
            {
                return BadRequest("Could not extract any text from the document.");
            }
            chat.AddUserMessage($"Please extract the catalog items from this text: \n\n{extractedText}");
        }

        string rawResponse = string.Empty;
        try
        {
            var response = await chatService.GetChatMessageContentAsync(chat);
            rawResponse = response.Content ?? string.Empty;
        }
        catch (Exception ex)
        {
            return BadRequest($"LLM Agent failed to process document: {ex.Message}");
        }

        // Clean markdown backticks if the model returned them
        rawResponse = rawResponse.Trim();
        if (rawResponse.StartsWith("```"))
        {
            var lines = rawResponse.Split('\n');
            var cleanedLines = lines.Where(l => !l.StartsWith("```")).ToArray();
            rawResponse = string.Join("\n", cleanedLines);
        }
        rawResponse = rawResponse.Trim();

        List<ExtractedProductDto>? products = null;
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            };
            products = JsonSerializer.Deserialize<List<ExtractedProductDto>>(rawResponse, options);
        }
        catch (Exception)
        {
            var arrayMatch = Regex.Match(rawResponse, @"\[\s*\{.*\}\s*\]", RegexOptions.Singleline);
            if (arrayMatch.Success)
            {
                try
                {
                    products = JsonSerializer.Deserialize<List<ExtractedProductDto>>(arrayMatch.Value);
                }
                catch { }
            }
        }

        if (products == null || !products.Any())
        {
            return BadRequest($"Could not parse structured product catalog. Raw LLM response: {rawResponse}");
        }

        var addedItems = new List<CatalogItem>();
        foreach (var p in products)
        {
            var item = new CatalogItem
            {
                Id = $"prod-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString().Substring(0, 4)}",
                ProductName = p.ProductName ?? "Unknown Product",
                Description = p.Description ?? string.Empty,
                Price = p.Price,
                Sku = p.Sku ?? $"SKU-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}",
                Category = p.Category ?? "General",
                SubsidiaryId = subsidiaryId ?? "common",
                SubsidiaryName = subName
            };

            await _catalogRepository.SaveAsync(item);
            addedItems.Add(item);
        }

        await _logService.AddLogAsync(
            $"SUCCESS: Catalog uploaded and parsed successfully. {addedItems.Count} products extracted by agent from file '{file.FileName}'.",
            "success",
            subsidiaryName: subName
        );

        return Ok(new { success = true, items = addedItems });
    }
}

public class ExtractedProductDto
{
    [JsonPropertyName("productName")]
    public string? ProductName { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("price")]
    public double Price { get; set; }

    [JsonPropertyName("sku")]
    public string? Sku { get; set; }

    [JsonPropertyName("category")]
    public string? Category { get; set; }
}
