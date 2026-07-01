using System;
using System.ComponentModel;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;

namespace coreapi.Infrastructure.AI.Plugins;

public class WebSearchPlugin
{
    private readonly HttpClient _httpClient;

    public WebSearchPlugin()
    {
        _httpClient = new HttpClient();
        // DuckDuckGo often blocks default HttpClient user agents
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    }

    [KernelFunction("SearchInternet")]
    [Description("Searches the internet for information on a given topic and returns a summary of the top results. Use this when you need real-time data, current events, or information you do not already know.")]
    public async Task<string> SearchInternetAsync([Description("The search query")] string query)
    {
        try
        {
            var searchUrl = $"https://html.duckduckgo.com/html/?q={Uri.EscapeDataString(query)}";
            var html = await _httpClient.GetStringAsync(searchUrl);

            // Simple regex to extract snippets from DuckDuckGo HTML Lite version
            var snippetRegex = new Regex(@"class=""result__snippet[^>]*>(.*?)</a>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
            var titleRegex = new Regex(@"class=""result__title[^>]*>.*?<a[^>]*>(.*?)</a>", RegexOptions.IgnoreCase | RegexOptions.Singleline);

            var snippets = snippetRegex.Matches(html);
            var titles = titleRegex.Matches(html);

            if (snippets.Count == 0)
            {
                return "No search results found.";
            }

            var resultText = $"Search results for '{query}':\n\n";
            int limit = Math.Min(5, snippets.Count);

            for (int i = 0; i < limit; i++)
            {
                // Clean HTML tags from results
                var cleanTitle = titles.Count > i ? Regex.Replace(titles[i].Groups[1].Value, "<.*?>", String.Empty).Trim() : "";
                var cleanSnippet = Regex.Replace(snippets[i].Groups[1].Value, "<.*?>", String.Empty).Trim();
                
                // Decode HTML entities
                cleanTitle = System.Net.WebUtility.HtmlDecode(cleanTitle);
                cleanSnippet = System.Net.WebUtility.HtmlDecode(cleanSnippet);

                resultText += $"{i + 1}. {cleanTitle}\n{cleanSnippet}\n\n";
            }

            return resultText;
        }
        catch (Exception ex)
        {
            return $"Error performing search: {ex.Message}";
        }
    }
}
