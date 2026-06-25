using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;

namespace CoreApi.Application.Services.Implementations;

public static class DocumentParserHelper
{
    public static string ParseDocx(Stream stream)
    {
        try
        {
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, true);
            var entry = archive.GetEntry("word/document.xml");
            if (entry == null) return string.Empty;

            using var entryStream = entry.Open();
            using var reader = new StreamReader(entryStream, Encoding.UTF8);
            var xmlContent = reader.ReadToEnd();

            var matches = Regex.Matches(xmlContent, @"<w:t[^>]*>(.*?)</w:t>");
            var sb = new StringBuilder();
            foreach (Match match in matches)
            {
                sb.Append(match.Groups[1].Value).Append(" ");
            }
            return sb.ToString().Trim();
        }
        catch (Exception ex)
        {
            return $"[DOCX Extraction Error: {ex.Message}]";
        }
    }

    public static string ParseXlsx(Stream stream)
    {
        try
        {
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, true);
            
            var sharedStrings = new List<string>();
            var sharedStringsEntry = archive.GetEntry("xl/sharedStrings.xml");
            if (sharedStringsEntry != null)
            {
                using var sStream = sharedStringsEntry.Open();
                using var reader = new StreamReader(sStream, Encoding.UTF8);
                var xmlContent = reader.ReadToEnd();
                var matches = Regex.Matches(xmlContent, @"<t[^>]*>(.*?)</t>");
                foreach (Match match in matches)
                {
                    sharedStrings.Add(match.Groups[1].Value);
                }
            }

            var sheetEntry = archive.GetEntry("xl/worksheets/sheet1.xml");
            if (sheetEntry == null) return string.Empty;

            using var wStream = sheetEntry.Open();
            using var wReader = new StreamReader(wStream, Encoding.UTF8);
            var sheetXml = wReader.ReadToEnd();

            var sb = new StringBuilder();
            // Match cell values and cross-reference with sharedStrings if t="s"
            var cellMatches = Regex.Matches(sheetXml, @"<c[^>]*>(.*?)</c>");
            foreach (Match cellMatch in cellMatches)
            {
                var xml = cellMatch.Value;
                var valMatch = Regex.Match(xml, @"<v>([^<]+)</v>");
                if (valMatch.Success)
                {
                    var val = valMatch.Groups[1].Value;
                    if (xml.Contains("t=\"s\""))
                    {
                        if (int.TryParse(val, out int idx) && idx >= 0 && idx < sharedStrings.Count)
                        {
                            sb.Append(sharedStrings[idx]).Append(" ");
                        }
                    }
                    else
                    {
                        sb.Append(val).Append(" ");
                    }
                }
            }
            return sb.ToString().Trim();
        }
        catch (Exception ex)
        {
            return $"[XLSX Extraction Error: {ex.Message}]";
        }
    }
}
