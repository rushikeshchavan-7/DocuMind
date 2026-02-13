FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY DocuMind.sln .
COPY DocuMind.Domain/DocuMind.Domain.csproj DocuMind.Domain/
COPY DocuMind.Application/DocuMind.Application.csproj DocuMind.Application/
COPY DocuMind.Infrastructure/DocuMind.Infrastructure.csproj DocuMind.Infrastructure/
COPY DocuMind.API/DocuMind.API.csproj DocuMind.API/

# Restore
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish DocuMind.API -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

# Create storage dir
RUN mkdir -p Storage/Documents

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "DocuMind.API.dll"]
