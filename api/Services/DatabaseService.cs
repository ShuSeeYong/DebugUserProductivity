using Microsoft.Data.SqlClient;
using System.Data;

namespace Api.Services;

public class DatabaseService
{
    private readonly string _connectionString;

    public DatabaseService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' not found.");
    }

    public async Task<DataTable> ExecuteStoredProcedureAsync(string spName, Dictionary<string, object>? parameters = null)
    {
        using var connection = new SqlConnection(_connectionString);
        using var command = new SqlCommand(spName, connection);
        command.CommandType = CommandType.StoredProcedure;
        command.CommandTimeout = 900;

        if (parameters != null)
        {
            foreach (var param in parameters)
            {
                command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
            }
        }

        await connection.OpenAsync();
        using var reader = await command.ExecuteReaderAsync();

        var dataTable = new DataTable();
        dataTable.Load(reader);
        return dataTable;
    }

    public async Task<int> ExecuteNonQueryAsync(string spName, Dictionary<string, object>? parameters = null)
    {
        using var connection = new SqlConnection(_connectionString);
        using var command = new SqlCommand(spName, connection);
        command.CommandType = CommandType.StoredProcedure;
        command.CommandTimeout = 900;

        if (parameters != null)
        {
            foreach (var param in parameters)
            {
                command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
            }
        }

        await connection.OpenAsync();
        return await command.ExecuteNonQueryAsync();
    }
}
