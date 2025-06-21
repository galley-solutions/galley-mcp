# Galley MCP Server

A Model Context Protocol (MCP) server for Galley GraphQL API integration using Apollo MCP Server with **mandatory automatic schema introspection**. The server introspects your Galley GraphQL schema on startup and provides seamless integration with MCP clients like Claude, Cursor, and VS Code.

## 🚀 Quick Start

### Prerequisites

- Docker installed on your system
- Galley API authentication (X-API-KEY or Bearer token)
- Network access to Galley GraphQL endpoints

### Build and Run

```bash
# Option 1: Use pre-built image from public ECR (recommended)
docker run -i -e X_API_KEY="your_api_key_here" public.ecr.aws/galley-mcp:latest

# Option 2: Build from source
# Clone the repository
git clone <your-repo-url>
cd galley-mcp

# Build the Docker image
docker build -t galley-mcp .

# Run with X-API-KEY authentication
docker run -i -e X_API_KEY="your_api_key_here" galley-mcp

# Or run with Bearer token authentication
docker run -i -e GALLEY_AUTH_TOKEN="your_bearer_token_here" galley-mcp
```

### Pre-built Images

Pre-built multi-architecture Docker images are available from Amazon ECR Public Gallery:

- **Registry**: `public.ecr.aws/galley-mcp`
- **Latest**: `public.ecr.aws/galley-mcp:latest`
- **Architectures**: `linux/amd64`, `linux/arm64`
- **Automatic builds**: Images are automatically built and published on every commit to master branch

**Version Tags Available:**
- `latest` - Latest stable version from master branch
- `v1.0.0`, `v1.1.0`, etc. - Semantic version tags
- `master` - Latest development version from master branch
- `develop` - Latest development version from develop branch

### What Happens on Startup

1. **Schema Introspection**: Automatically introspects the Galley GraphQL schema from `https://app.galleysolutions.com/graphql`
2. **Schema Validation**: Verifies the schema was successfully retrieved (startup fails if introspection fails)
3. **MCP Server Start**: Launches Apollo MCP Server with the introspected schema and your operations

### Important: Interactive Mode Required

MCP servers need to run in **interactive mode** (`-i` flag) to communicate with MCP clients. This allows:
- **Bidirectional communication** between the client and server
- **Real-time request/response handling** for GraphQL operations
- **Proper stdin/stdout stream management** for MCP protocol

Always use `docker run -i` when running the container for MCP client integration.

## 📋 Docker Installation

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt-get update

# Install required packages
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
```

### macOS

#### Option 1: Docker Desktop (Recommended)
1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install the `.dmg` file
3. Launch Docker Desktop from Applications
4. Verify installation: `docker --version`

#### Option 2: Homebrew
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker
brew install --cask docker

# Launch Docker Desktop
open /Applications/Docker.app

# Verify installation
docker --version
```

### Windows

#### Option 1: Docker Desktop (Recommended)
1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Run the installer
3. Restart your computer when prompted
4. Launch Docker Desktop
5. Verify installation: `docker --version`

#### Option 2: WSL2 + Docker (Advanced)
```powershell
# Enable WSL2
wsl --install

# Install Docker in WSL2
# Follow Linux installation steps inside WSL2
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `X_API_KEY` | Galley X-API-KEY authentication | - | * |
| `GALLEY_AUTH_TOKEN` | Galley Bearer token authentication | - | * |
| `ENDPOINT` | GraphQL endpoint URL for MCP operations | `https://staging-app.galleysolutions.com/graphql` | No |
| `INTROSPECT_ENDPOINT` | Schema introspection endpoint | `https://app.galleysolutions.com/graphql` | No |
| `USER_DIRECTORY` | Additional operations directory to mount | - | No |
| `APOLLOGRAPHQL_CLIENT_NAME` | Client identification header | `galley-mcp-server@{hostname}` | No |
| `SCHEMA_OUTPUT` | Schema output file path | `/app/schema.graphql` | No |
| `MCP_DEBUG` | Enable debug mode with verbose logging | `false` | No |
| `DISABLE_INTROSPECTION` | Disable introspection capability on MCP server | `false` | No |
| `ALLOW_MUTATIONS` | Control mutation permissions: `none`, `explicit`, or `all` | `none` | No |

**Authentication Priority**: `X_API_KEY` takes precedence over `GALLEY_AUTH_TOKEN` if both are provided.

### Debug Mode

Set `MCP_DEBUG=true` to enable verbose logging and detailed output:

- **Schema Introspection**: Shows detailed Rover output and schema statistics
- **Apollo MCP Server**: Enables debug logging with `--log DEBUG`
- **Configuration**: Displays all environment variables and settings
- **Silent Mode**: When `MCP_DEBUG=false` (default), minimal output for production use

```bash
# Enable debug mode
docker run -i -e X_API_KEY="your_key" -e MCP_DEBUG=true public.ecr.aws/galley-mcp:latest

# Silent mode (default)
docker run -i -e X_API_KEY="your_key" public.ecr.aws/galley-mcp:latest
```

### Schema Introspection

- **Mandatory**: Schema introspection runs on every startup and cannot be skipped
- **Fail-Fast**: Server will not start if schema introspection fails
- **Authentication**: Uses the same authentication method (X-API-KEY or Bearer token) for introspection
- **Output**: Schema is saved to `/app/schema.graphql` and used by Apollo MCP Server

### Introspection Control

The MCP server supports introspection capabilities that allow clients to explore the GraphQL schema dynamically. You can control this behavior with the `DISABLE_INTROSPECTION` environment variable:

- **Default behavior**: Introspection is enabled (`DISABLE_INTROSPECTION=false`)
- **Security consideration**: Disable introspection in production environments for security
- **Client impact**: When disabled, MCP clients cannot dynamically explore the schema

```bash
# Enable introspection (default)
docker run -i -e X_API_KEY="your_key" public.ecr.aws/galley-mcp:latest

# Disable introspection for production
docker run -i -e X_API_KEY="your_key" -e DISABLE_INTROSPECTION=true public.ecr.aws/galley-mcp:latest
```

### Mutation Control

The MCP server provides fine-grained control over GraphQL mutations through the `ALLOW_MUTATIONS` environment variable. This helps maintain data safety and control what operations MCP clients can perform:

- **`none`** (default): Don't allow any mutations - read-only access
- **`explicit`**: Allow only pre-defined mutations from operation files, but don't allow the LLM to build new mutations dynamically
- **`all`**: Allow the LLM to build and execute mutations dynamically (highest risk)

```bash
# Read-only mode (default)
docker run -i -e X_API_KEY="your_key" public.ecr.aws/galley-mcp:latest

# Allow only explicit mutations from operation files
docker run -i -e X_API_KEY="your_key" -e ALLOW_MUTATIONS=explicit public.ecr.aws/galley-mcp:latest

# Allow LLM to build mutations (use with caution)
docker run -i -e X_API_KEY="your_key" -e ALLOW_MUTATIONS=all public.ecr.aws/galley-mcp:latest
```

**Security Recommendation**: Use `none` or `explicit` in production environments to prevent unintended data modifications.

### Example Configurations

#### Production Setup (Read-only)
```bash
docker run -i \
  -e X_API_KEY="prod_api_key_here" \
  -e ENDPOINT="https://app.galleysolutions.com/graphql" \
  -e INTROSPECT_ENDPOINT="https://app.galleysolutions.com/graphql" \
  -e APOLLOGRAPHQL_CLIENT_NAME="production-server@prod-host" \
  -e DISABLE_INTROSPECTION=true \
  -e ALLOW_MUTATIONS=none \
  public.ecr.aws/galley-mcp:latest
```

#### Production Setup (Explicit Mutations Only)
```bash
docker run -i \
  -e X_API_KEY="prod_api_key_here" \
  -e ENDPOINT="https://app.galleysolutions.com/graphql" \
  -e INTROSPECT_ENDPOINT="https://app.galleysolutions.com/graphql" \
  -e APOLLOGRAPHQL_CLIENT_NAME="production-server@prod-host" \
  -e DISABLE_INTROSPECTION=true \
  -e ALLOW_MUTATIONS=explicit \
  public.ecr.aws/galley-mcp:latest
```

#### Development with Custom Operations and Debug
```bash
docker run -i \
  -e X_API_KEY="dev_api_key_here" \
  -e USER_DIRECTORY="/custom/operations" \
  -e MCP_DEBUG=true \
  -e ALLOW_MUTATIONS=all \
  -v ./custom-operations:/custom/operations \
  public.ecr.aws/galley-mcp:latest
```

#### Staging Environment
```bash
docker run -i \
  -e X_API_KEY="staging_api_key_here" \
  -e ENDPOINT="https://staging-app.galleysolutions.com/graphql" \
  -e APOLLOGRAPHQL_CLIENT_NAME="staging-server@staging-host" \
  public.ecr.aws/galley-mcp:latest
```

## 🔌 MCP Client Integration

### Claude Desktop

1. **Install Claude Desktop** from [https://claude.ai/download](https://claude.ai/download)

2. **Configure MCP Server** in Claude's settings:
   
   **Read-only configuration (recommended):**
   ```json
   {
     "mcpServers": {
       "galley": {
         "command": "docker",
         "args": [
           "run",
           "--rm",
           "-i",
           "-e", "X_API_KEY=your_api_key_here",
           "-e", "DISABLE_INTROSPECTION=true",
           "-e", "ALLOW_MUTATIONS=none",
           "public.ecr.aws/galley-mcp:latest"
         ],
         "env": {}
       }
     }
   }
   ```
   
   **Allow explicit mutations:**
   ```json
   {
     "mcpServers": {
       "galley": {
         "command": "docker",
         "args": [
           "run",
           "--rm",
           "-i",
           "-e", "X_API_KEY=your_api_key_here",
           "-e", "ALLOW_MUTATIONS=explicit",
           "public.ecr.aws/galley-mcp:latest"
         ],
         "env": {}
       }
     }
   }
   ```

3. **Restart Claude Desktop** to load the MCP server

### Cursor IDE

1. **Install Cursor** from [https://cursor.sh](https://cursor.sh)

2. **Add MCP Configuration** in Cursor settings:
   - Open Settings → Extensions → MCP
   - Add new server configuration:
   ```json
   {
     "name": "galley",
     "command": "docker",
     "args": [
       "run", "--rm", "-i",
       "-e", "X_API_KEY=your_api_key_here",
       "public.ecr.aws/galley-mcp:latest"
     ]
   }
   ```

3. **Enable the MCP server** in Cursor's MCP panel

### VS Code

1. **Install VS Code** from [https://code.visualstudio.com](https://code.visualstudio.com)

2. **Install MCP Extension**:
   - Open Extensions panel (`Ctrl+Shift+X`)
   - Search for "Model Context Protocol"
   - Install the MCP extension

3. **Configure MCP Server**:
   - Open VS Code settings (`Ctrl+,`)
   - Search for "MCP"
   - Add server configuration:
   ```json
   {
     "mcp.servers": {
       "galley": {
         "command": "docker",
         "args": [
           "run", "--rm", "-i",
           "-e", "X_API_KEY=your_api_key_here",
           "public.ecr.aws/galley-mcp:latest"
         ]
       }
     }
   }
   ```

## 🛠️ Development

### Custom Operations

Add your own GraphQL operations by mounting a custom directory:

```bash
# Create custom operations directory
mkdir -p ./my-operations

# Add your .graphql files
echo 'query MyCustomQuery { viewer { id } }' > ./my-operations/MyQuery.graphql

# Run with custom operations
docker run -i \
  -e X_API_KEY="your_api_key" \
  -e USER_DIRECTORY="/custom" \
  -v ./my-operations:/custom \
  public.ecr.aws/galley-mcp:latest
```

### Schema Introspection

The server automatically introspects the Galley GraphQL schema on startup. The schema is saved to `/app/schema.graphql` and used by the Apollo MCP Server.

**Key Features:**
- **Mandatory execution**: Cannot be skipped or disabled
- **Fail-fast behavior**: Server stops if introspection fails
- **Authentication**: Uses same credentials as MCP operations
- **Real-time schema**: Always gets the latest schema on startup
- **Client identification**: Sends `apollographql-client-name` header for tracking

### Built-in Tools

The Docker image includes:
- **Apollo MCP Server**: Latest version installed to `/usr/local/bin`
- **Rover**: Apollo's GraphQL CLI tool for schema introspection
- **Debian Bookworm Slim**: Lightweight base image with glibc support

### Debugging

Enable debug mode for detailed output and troubleshooting:

```bash
# Enable debug mode for verbose logging
docker run -i -e X_API_KEY="your_api_key" -e MCP_DEBUG=true public.ecr.aws/galley-mcp:latest

# View container logs
docker logs <container_id>

# Run interactively to see all output
docker run -it -e X_API_KEY="your_api_key" -e MCP_DEBUG=true public.ecr.aws/galley-mcp:latest

# Test with different endpoints in debug mode
docker run -i \
  -e X_API_KEY="your_api_key" \
  -e MCP_DEBUG=true \
  -e INTROSPECT_ENDPOINT="https://staging-app.galleysolutions.com/graphql" \
  public.ecr.aws/galley-mcp:latest
```

**Debug Mode Features:**
- Shows all configuration values
- Displays Rover introspection command and output
- Shows schema statistics (lines, file size)
- Enables Apollo MCP Server debug logging
- Displays authentication method being used

## 📁 Project Structure

```
galley-mcp/
├── Dockerfile                 # Docker container with Apollo MCP Server + Rover
├── entrypoint.sh             # Main startup script with mandatory introspection
├── introspect-schema.sh      # Schema introspection script using Rover
├── operations/               # GraphQL operations directory
│   └── GetRecipesByName.graphql  # Example Galley recipe query
└── README.md                # This comprehensive guide
```

### Key Components

- **entrypoint.sh**: Orchestrates schema introspection and server startup
- **introspect-schema.sh**: Uses Rover to fetch the latest Galley GraphQL schema
- **operations/**: Contains your GraphQL operations (queries, mutations, subscriptions)
- **Dockerfile**: Multi-stage build with Apollo MCP Server and Rover pre-installed

## 🔄 CI/CD Pipeline

The project includes automated CI/CD using GitHub Actions:

### Automated Builds
- **Multi-architecture**: Builds for both `linux/amd64` and `linux/arm64`
- **Public ECR**: Automatically publishes to Amazon ECR Public Gallery
- **Version tagging**: Supports semantic versioning and branch-based tags
- **Caching**: Uses GitHub Actions cache for faster builds

### Triggers
- **Push to master**: Builds and publishes with `latest` tag
- **Push to develop**: Builds and publishes with `develop` tag
- **Version tags**: Builds and publishes with semantic version tags (`v1.0.0`, etc.)
- **Pull requests**: Builds for testing (does not publish)

### Repository Setup
To set up the CI/CD pipeline, configure these GitHub repository secrets:
- `AWS_ACCESS_KEY_ID`: AWS access key for ECR push permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for ECR push permissions

The ECR repository needs to be created as a public repository in `us-east-1` region with the name `galley-mcp`.

## 🔧 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Verify your API key is correct
docker run -i -e X_API_KEY="your_key" public.ecr.aws/galley-mcp:latest

# Check if endpoint is accessible
curl -H "X-API-KEY: your_key" https://app.galleysolutions.com/graphql
```

#### Schema Introspection Fails
```bash
# Check network connectivity to introspection endpoint
docker run --rm -e X_API_KEY="your_key" public.ecr.aws/galley-mcp:latest ping -c 3 app.galleysolutions.com

# Test GraphQL endpoint manually
curl -X POST -H "Content-Type: application/json" \
  -H "X-API-KEY: your_key" \
  -d '{"query": "{ __schema { types { name } } }"}' \
  https://app.galleysolutions.com/graphql

# Check if introspection endpoint is different from operation endpoint
docker run -i \
  -e X_API_KEY="your_key" \
  -e INTROSPECT_ENDPOINT="https://staging-app.galleysolutions.com/graphql" \
  public.ecr.aws/galley-mcp:latest

# Verify authentication method
# Try with Bearer token instead of X-API-KEY
docker run -i -e GALLEY_AUTH_TOKEN="your_token" public.ecr.aws/galley-mcp:latest
```

#### Apollo MCP Server Issues
```bash
# Verify Apollo MCP Server is installed correctly
docker run --rm public.ecr.aws/galley-mcp:latest which apollo-mcp-server
docker run --rm public.ecr.aws/galley-mcp:latest apollo-mcp-server --version

# Check if schema file exists after introspection
docker run --rm -e X_API_KEY="your_key" public.ecr.aws/galley-mcp:latest ls -la /app/schema.graphql
```

#### Docker Issues
```bash
# Check Docker is running
docker --version

# Pull latest base image
docker pull debian:bookworm-slim

# Rebuild without cache
docker build --no-cache -t galley-mcp .
```

### Getting Help

1. **Check startup logs**: `docker logs <container_id>` - Shows introspection and startup process
2. **Verify authentication**: Ensure your X-API-KEY or Bearer token is valid
3. **Test endpoints**: Confirm both introspection and operation endpoints are accessible
4. **Check Docker**: Make sure you're using the latest Docker version
5. **Rebuild image**: Try `docker build --no-cache -t galley-mcp .` to force fresh build

### Common Success Indicators

When everything works correctly, you should see:

**Silent Mode (MCP_DEBUG=false, default):**
```
Error: Schema introspection failed. Server cannot start without valid schema.
(Only errors are shown)
```

**Debug Mode (MCP_DEBUG=true):**
```
Starting Apollo MCP Server with Galley configuration...
Endpoint: https://staging-app.galleysolutions.com/graphql
Operations directory: /app/operations
Graph reference: Galley-dtd1yd@current
Client name: galley-mcp-server@hostname
Debug mode: true
Running mandatory schema introspection...
Rover is available
Introspecting schema from: https://app.galleysolutions.com/graphql
Using X-API-KEY for introspection
Running: rover graph introspect https://app.galleysolutions.com/graphql --output /app/schema.graphql --log DEBUG --header X-API-KEY:your_key --header apollographql-client-name:galley-mcp-introspect@hostname
Schema introspection completed successfully!
Schema saved to: /app/schema.graphql
Schema file: XXXX lines, XXXkB
Schema introspection completed successfully, starting server...
Using X-API-KEY authentication
```

## 📄 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

For more information about the Model Context Protocol, visit [https://modelcontextprotocol.io](https://modelcontextprotocol.io)