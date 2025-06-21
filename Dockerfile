# Use Debian Slim as the base image for small size with glibc compatibility
# Debian Slim provides glibc support required by Apollo MCP Server (~30MB)
FROM debian:bookworm-slim

# Install curl (bash is already included)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Download and install Apollo MCP Server
# The script will detect glibc and download the appropriate binary
RUN curl -sSL https://mcp.apollo.dev/download/nix/v0.3.0 | bash

# Move the MCP binary to a standard location
RUN mv ./apollo-mcp-server /usr/local/bin/apollo-mcp-server

# Test if the MCP server is installed correctly
RUN apollo-mcp-server -h

# Download and install Rover
RUN curl -sSL https://rover.apollo.dev/nix/latest | sh

# Add Rover to PATH
ENV PATH="/root/.rover/bin:$PATH"

# Copy the operations folder and scripts
COPY operations/ /app/operations/
COPY entrypoint.sh /app/entrypoint.sh
COPY introspect-schema.sh /app/introspect-schema.sh

# Make scripts executable
RUN chmod +x /app/entrypoint.sh /app/introspect-schema.sh

# Set working directory
WORKDIR /app

# Default command
CMD ["./entrypoint.sh"]
