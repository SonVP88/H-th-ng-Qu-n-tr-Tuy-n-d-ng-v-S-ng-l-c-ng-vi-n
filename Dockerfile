FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy toàn bộ code vào (bao gồm cả thư mục UTC_DATN)
COPY . .

# Di chuyển vào thư mục chứa code BE để build
WORKDIR "/src/UTC_DATN"
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /s
COPY --from=build /app/publish .

# Kiểm tra kỹ tên file .dll này có đúng là UTC_DATN.dll không nhé
ENTRYPOINT ["dotnet", "UTC_DATN.dll"]