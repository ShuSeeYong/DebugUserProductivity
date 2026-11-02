using Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductivityController : ControllerBase
{
    private readonly DatabaseService _db;

    public ProductivityController(DatabaseService db)
    {
        _db = db;
    }

    // GET api/productivity
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var dataTable = await _db.ExecuteStoredProcedureAsync("sp_GetUserProductivity");

            var result = new List<Dictionary<string, object?>>();
            foreach (DataRow row in dataTable.Rows)
            {
                var dict = new Dictionary<string, object?>();
                foreach (DataColumn col in dataTable.Columns)
                {
                    dict[col.ColumnName] = row[col] == DBNull.Value ? null : row[col];
                }
                result.Add(dict);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to fetch data", details = ex.Message });
        }
    }
}
