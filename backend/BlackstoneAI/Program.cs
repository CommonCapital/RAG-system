using BlackstoneAI.Services;
using BlackstoneAI.Workers;

// Load .env file if present (dev convenience — prod uses real env vars)
var envFile = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envFile))
    foreach (var line in File.ReadAllLines(envFile))
    {
        var trimmed = line.Trim();
        if (trimmed.StartsWith('#') || !trimmed.Contains('=')) continue;
        var idx = trimmed.IndexOf('=');
        Environment.SetEnvironmentVariable(trimmed[..idx], trimmed[(idx + 1)..]);
    }

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddHttpClient<DeepSeekClient>();
builder.Services.AddSingleton<DeepSeekClient>();
builder.Services.AddSingleton<MemoryService>();
builder.Services.AddSingleton<ChatQueueService>(sp =>
    ChatQueueService.CreateAsync(sp.GetRequiredService<IConfiguration>()).GetAwaiter().GetResult());

builder.Services.AddHostedService<ChatWorker>();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(
        builder.Configuration["NEXT_PUBLIC_URL"] ?? "http://localhost:3000"
    ).AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();
app.UseCors();
app.MapControllers();
app.Run();
