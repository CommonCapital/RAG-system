using BlackstoneAI.Services;
using BlackstoneAI.Workers;

var builder = WebApplication.CreateBuilder(args);

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
