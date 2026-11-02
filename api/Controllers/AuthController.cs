using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private const int MaxLoginAttempts = 3;
    private const int LockDurationMinutes = 15;
    private const string EncryptionKey = "jtesw_ws";

    private static readonly Dictionary<string, (int attempts, DateTime lastFailed)> _loginAttempts = new();

    public AuthController(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NtLogin) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { success = false, message = "Please enter both NT Login and Password." });
        }

        var username = request.NtLogin.Trim();

        // Check if account is locked due to too many attempts
        if (IsAccountLocked(username))
        {
            return Ok(new { success = false, message = $"Access has been locked. Please try again in {LockDurationMinutes} minutes." });
        }

        // Authenticate via SOAP web service
        var isAuthenticated = await AuthenticateViaSoap(username, request.Password);

        if (isAuthenticated)
        {
            _loginAttempts.Remove(username.ToLower());

            return Ok(new
            {
                success = true,
                ntLogin = username,
                name = username,
                message = "Login successful"
            });
        }
        else
        {
            RecordFailedAttempt(username);
            var remaining = GetRemainingAttempts(username);

            if (remaining <= 0)
            {
                return Ok(new { success = false, message = $"Access has been locked. Please try again in {LockDurationMinutes} minutes." });
            }

            return Ok(new { success = false, message = $"Invalid user name or password. You have {remaining} attempt{(remaining == 1 ? "" : "s")} left." });
        }
    }

    private async Task<bool> AuthenticateViaSoap(string username, string password)
    {
        try
        {
            var webServiceUrl = _config["Authentication:WebServiceAddress"]
                ?? "http://penesdev/jtesw_ws/jtesw_webservice.asmx";

            // Encrypt password using DES (same as original app)
            var encryptedPassword = DesEncrypt(password, EncryptionKey);

            // Build SOAP request
            var soapEnvelope = $@"<?xml version=""1.0"" encoding=""utf-8""?>
<soap:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance""
               xmlns:xsd=""http://www.w3.org/2001/XMLSchema""
               xmlns:soap=""http://schemas.xmlsoap.org/soap/envelope/"">
  <soap:Body>
    <ValidateUserCredentialsInAD xmlns=""http://penesdev/jtesw_ws/"">
      <userName>{EscapeXml(username)}</userName>
      <password>{EscapeXml(encryptedPassword)}</password>
    </ValidateUserCredentialsInAD>
  </soap:Body>
</soap:Envelope>";

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);
            var content = new StringContent(soapEnvelope, Encoding.UTF8, "text/xml");
            content.Headers.Add("SOAPAction", "\"http://jpetewebapp/jtesw_ws/ValidateUserCredentialsInAD\"");

            var response = await client.PostAsync(webServiceUrl, content);

            if (!response.IsSuccessStatusCode)
            {
                Console.Error.WriteLine($"SOAP service returned {response.StatusCode}");
                return false;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"SOAP Response: {responseBody.Substring(0, Math.Min(500, responseBody.Length))}");

            // Parse CommonDTO response
            var doc = XDocument.Parse(responseBody);
            var ns = XNamespace.Get("http://jpetewebapp/jtesw_ws/");

            // Find ReturnedValue - when auth succeeds it's "true"
            var returnedValue = doc.Descendants(ns + "ReturnedValue").FirstOrDefault();

            if (returnedValue != null && !string.IsNullOrWhiteSpace(returnedValue.Value))
            {
                if (bool.TryParse(returnedValue.Value, out var result))
                {
                    return result;
                }
            }

            // Check GenericMessages - if it has child elements, authentication failed
            var genericMessages = doc.Descendants(ns + "GenericMessages").FirstOrDefault();
            if (genericMessages != null && !genericMessages.HasElements)
            {
                // Empty GenericMessages + no ReturnedValue = check differently
                return false;
            }

            return false;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"SOAP Authentication error: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// DES encryption matching the original Cryptography.Encrypt method
    /// </summary>
    private static string DesEncrypt(string plainText, string key)
    {
        if (plainText == null) plainText = "";

        byte[] iv = { 110, 120, 130, 140, 150, 160, 170, 180 };
        byte[] keyBytes = Encoding.UTF8.GetBytes(key.Substring(0, 8));

        try
        {
#pragma warning disable SYSLIB0021 // DES is obsolete but needed for compatibility
            using var des = new DESCryptoServiceProvider();
#pragma warning restore SYSLIB0021
            byte[] inputBytes = Encoding.UTF8.GetBytes(plainText);
            using var ms = new MemoryStream();
            using var cs = new CryptoStream(ms, des.CreateEncryptor(keyBytes, iv), CryptoStreamMode.Write);
            cs.Write(inputBytes, 0, inputBytes.Length);
            cs.FlushFinalBlock();
            return Convert.ToBase64String(ms.ToArray());
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string EscapeXml(string value)
    {
        return value
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'", "&apos;");
    }

    private bool IsAccountLocked(string username)
    {
        var key = username.ToLower();
        if (_loginAttempts.TryGetValue(key, out var info))
        {
            if (info.attempts >= MaxLoginAttempts)
            {
                if (info.lastFailed.AddMinutes(LockDurationMinutes) >= DateTime.Now)
                    return true;
                else
                    _loginAttempts.Remove(key);
            }
        }
        return false;
    }

    private void RecordFailedAttempt(string username)
    {
        var key = username.ToLower();
        if (_loginAttempts.TryGetValue(key, out var info))
            _loginAttempts[key] = (info.attempts + 1, DateTime.Now);
        else
            _loginAttempts[key] = (1, DateTime.Now);
    }

    private int GetRemainingAttempts(string username)
    {
        var key = username.ToLower();
        if (_loginAttempts.TryGetValue(key, out var info))
            return MaxLoginAttempts - info.attempts;
        return MaxLoginAttempts;
    }
}

public class LoginRequest
{
    public string NtLogin { get; set; } = "";
    public string Password { get; set; } = "";
}
