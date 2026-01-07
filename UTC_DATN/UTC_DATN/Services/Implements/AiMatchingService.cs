using System.Text;
using System.Text.Json;
using UglyToad.PdfPig;
using UTC_DATN.DTOs.Ai;
using UTC_DATN.Services.Interfaces;

namespace UTC_DATN.Services.Implements;

public class AiMatchingService : IAiMatchingService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AiMatchingService> _logger;

    public AiMatchingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<AiMatchingService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Đọc text từ file PDF sử dụng PdfPig
    /// </summary>
    public async Task<string> ExtractTextFromPdfAsync(string filePath)
    {
        try
        {
            _logger.LogInformation("Extracting text from PDF: {FilePath}", filePath);

            if (!System.IO.File.Exists(filePath))
            {
                throw new FileNotFoundException($"PDF file not found: {filePath}");
            }

            var textBuilder = new StringBuilder();

            // Đọc PDF sử dụng PdfPig
            using (var document = PdfDocument.Open(filePath))
            {
                foreach (var page in document.GetPages())
                {
                    var pageText = page.Text;
                    textBuilder.AppendLine(pageText);
                }
            }

            var extractedText = textBuilder.ToString();
            _logger.LogInformation("Extracted {Length} characters from PDF", extractedText.Length);

            return await Task.FromResult(extractedText);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting text from PDF: {FilePath}", filePath);
            throw;
        }
    }

    /// <summary>
    /// Chấm điểm CV bằng Google Gemini AI
    /// </summary>
    public async Task<AiScoreResult> ScoreApplicationAsync(string cvText, string jobDescription)
    {
        try
        {
            _logger.LogInformation("Scoring application with AI");

            // Lấy API key từ configuration
            var apiKey = _configuration["GeminiAI:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Gemini API key not configured");
            }

            // Tạo prompt cho AI
            var prompt = CreateScoringPrompt(cvText, jobDescription);

            // Tạo request body cho Gemini API
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Gọi Gemini API - Sử dụng Gemini 2.5 Flash (theo danh sách model supports)
            var apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";
            var response = await _httpClient.PostAsync(apiUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API error: {StatusCode} - {Error}", response.StatusCode, errorContent);
                throw new HttpRequestException($"Gemini API returned {response.StatusCode}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("Gemini API response: {Response}", responseContent);

            // Parse response
            var aiResult = ParseGeminiResponse(responseContent);

            _logger.LogInformation("AI scoring completed. Score: {Score}", aiResult.Score);
            return aiResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scoring application with AI");
            throw;
        }
    }

    /// <summary>
    /// Tạo prompt cho AI
    /// </summary>
    private string CreateScoringPrompt(string cvText, string jobDescription)
    {
        return $@"Bạn là một chuyên gia tuyển dụng chuyên nghiệp. Nhiệm vụ của bạn là đánh giá mức độ phù hợp giữa CV của ứng viên và mô tả công việc.

**MÔ TẢ CÔNG VIỆC:**
{jobDescription}

**NỘI DUNG CV CỦA ỨNG VIÊN:**
{cvText}

Hãy phân tích và đánh giá CV theo các tiêu chí sau:
1. Kỹ năng kỹ thuật phù hợp
2. Kinh nghiệm làm việc liên quan
3. Trình độ học vấn
4. Các kỹ năng mềm

Trả về kết quả dưới dạng JSON với cấu trúc sau (KHÔNG thêm markdown, chỉ trả về JSON thuần):
{{
  ""score"": <số từ 0-100>,
  ""explanation"": ""<giải thích ngắn gọn về điểm số, tối đa 200 từ>"",
  ""matchedSkills"": [""<kỹ năng 1>"", ""<kỹ năng 2>"", ...],
  ""missingSkills"": [""<kỹ năng thiếu 1>"", ""<kỹ năng thiếu 2>"", ...]
}}

Lưu ý:
- Score phải là số nguyên từ 0-100
- Explanation phải ngắn gọn, súc tích
- MatchedSkills: Các kỹ năng mà ứng viên có và job yêu cầu
- MissingSkills: Các kỹ năng quan trọng mà job yêu cầu nhưng ứng viên chưa có";
    }

    /// <summary>
    /// Parse response từ Gemini API
    /// </summary>
    private AiScoreResult ParseGeminiResponse(string responseJson)
    {
        try
        {
            using var document = JsonDocument.Parse(responseJson);
            var root = document.RootElement;

            // Lấy text từ response
            var candidates = root.GetProperty("candidates");
            var firstCandidate = candidates[0];
            var content = firstCandidate.GetProperty("content");
            var parts = content.GetProperty("parts");
            var text = parts[0].GetProperty("text").GetString() ?? "";

            _logger.LogDebug("AI generated text: {Text}", text);

            // Clean text (remove markdown code blocks if any)
            text = text.Trim();
            if (text.StartsWith("```json"))
            {
                text = text.Substring(7);
            }
            if (text.StartsWith("```"))
            {
                text = text.Substring(3);
            }
            if (text.EndsWith("```"))
            {
                text = text.Substring(0, text.Length - 3);
            }
            text = text.Trim();

            // Parse JSON result
            using var resultDoc = JsonDocument.Parse(text);
            var resultRoot = resultDoc.RootElement;

            var result = new AiScoreResult
            {
                Score = resultRoot.GetProperty("score").GetInt32(),
                Explanation = resultRoot.GetProperty("explanation").GetString() ?? "",
                MatchedSkills = new List<string>(),
                MissingSkills = new List<string>()
            };

            // Parse matched skills
            if (resultRoot.TryGetProperty("matchedSkills", out var matchedSkills))
            {
                foreach (var skill in matchedSkills.EnumerateArray())
                {
                    result.MatchedSkills.Add(skill.GetString() ?? "");
                }
            }

            // Parse missing skills
            if (resultRoot.TryGetProperty("missingSkills", out var missingSkills))
            {
                foreach (var skill in missingSkills.EnumerateArray())
                {
                    result.MissingSkills.Add(skill.GetString() ?? "");
                }
            }

            // Validate score range
            if (result.Score < 0) result.Score = 0;
            if (result.Score > 100) result.Score = 100;

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing Gemini response: {Response}", responseJson);
            throw new InvalidOperationException("Failed to parse AI response", ex);
        }
    }
}
