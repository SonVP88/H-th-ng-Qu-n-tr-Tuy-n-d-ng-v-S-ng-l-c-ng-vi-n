using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UTC_DATN.Data;
using UTC_DATN.Services.Implements;
using UTC_DATN.Services.Interfaces;
var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("UTC_DATNContext");
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMasterDataService, MasterDataService>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<IAiMatchingService, AiMatchingService>();

// Đăng ký HttpClient cho AiMatchingService
builder.Services.AddHttpClient<IAiMatchingService, AiMatchingService>();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200", "https://localhost:4200") 
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Cho phép gửi credentials (cookies, authorization headers)
        });
});

builder.Services.AddDbContext<UTC_DATNContext>(options =>
    options.UseSqlServer(connectionString));
// Add services to the container.

builder.Services.AddControllers();

// Cấu hình file upload size limit
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10485760; // 10MB
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{

    app.MapOpenApi();
}

app.UseCors("AllowAngular");

// Serve static files từ wwwroot (cho file uploads)
app.UseStaticFiles();

app.UseAuthentication(); 
app.UseAuthorization();

// app.UseHttpsRedirection(); // Tắt trong development, chỉ dùng HTTP



app.MapControllers();

app.Run();
