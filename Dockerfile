FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ code vào trong container
COPY . .

# Restore và Publish (Render sẽ tự tìm file .csproj trong thư mục hiện tại)
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Nhớ kiểm tra xem tên file chạy của Sơn có đúng là UTC_DATN.dll không nhé
ENTRYPOINT ["dotnet", "UTC_DATN.dll"]