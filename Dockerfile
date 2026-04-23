FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Tìm và copy tất cả file .csproj vào để restore
COPY . .
RUN dotnet restore

# Build project
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Chỗ này Sơn lưu ý: Thay "UTC_DATN.dll" bằng đúng tên file dll của Sơn nếu nó khác nhé
ENTRYPOINT ["dotnet", "UTC_DATN.dll"]