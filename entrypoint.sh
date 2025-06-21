#!/bin/bash

# Set Apollo configuration environment variables
export APOLLO_KEY=""
export APOLLO_GRAPH_REF="Galley-dtd1yd@current"

# Default values that can be overridden with environment variables
GALLEY_AUTH_TOKEN=${GALLEY_AUTH_TOKEN:-""}
X_API_KEY=${X_API_KEY:-""}
ENDPOINT=${ENDPOINT:-"https://staging-app.galleysolutions.com/graphql"}
OPERATIONS_DIR=${OPERATIONS_DIR:-"/app/operations"}
USER_DIRECTORY=${USER_DIRECTORY:-""}
MCP_DEBUG=${MCP_DEBUG:-"false"}
DISABLE_INTROSPECTION=${DISABLE_INTROSPECTION:-"false"}
ALLOW_MUTATIONS=${ALLOW_MUTATIONS:-"none"}

# Get hostname for client identification
HOSTNAME=$(hostname)
CLIENT_NAME=${APOLLOGRAPHQL_CLIENT_NAME:-"galley-mcp-server@$HOSTNAME"}

# Debug output function
debug_echo() {
    if [ "$MCP_DEBUG" = "true" ]; then
        echo "$@"
    fi
}

debug_echo "Starting Apollo MCP Server with Galley configuration..."
debug_echo "Endpoint: $ENDPOINT"
debug_echo "Operations directory: $OPERATIONS_DIR"
debug_echo "Graph reference: $APOLLO_GRAPH_REF"
debug_echo "Client name: $CLIENT_NAME"
debug_echo "Debug mode: $MCP_DEBUG"
debug_echo "Disable introspection: $DISABLE_INTROSPECTION"
debug_echo "Allow mutations: $ALLOW_MUTATIONS"

# Run mandatory schema introspection on startup
debug_echo "Running mandatory schema introspection..."
if [ "$MCP_DEBUG" = "true" ]; then
    ./introspect-schema.sh
else
    ./introspect-schema.sh >/dev/null 2>&1
fi
if [ $? -ne 0 ]; then
    echo "Error: Schema introspection failed. Server cannot start without valid schema."
    exit 1
fi
debug_echo "Schema introspection completed successfully, starting server..."

# Determine authentication method
if [ -n "$X_API_KEY" ]; then
    debug_echo "Using X-API-KEY authentication"
    AUTH_HEADER="X-API-KEY: $X_API_KEY"
elif [ -n "$GALLEY_AUTH_TOKEN" ]; then
    debug_echo "Using Bearer token authentication"
    AUTH_HEADER="Authorization: Bearer $GALLEY_AUTH_TOKEN"
else
    debug_echo "Warning: No authentication token provided. Set either GALLEY_AUTH_TOKEN or X_API_KEY environment variable."
    AUTH_HEADER=""
fi

# Build command arguments
APOLLO_ARGS=(
    --directory "$OPERATIONS_DIR"
    --schema "/app/schema.graphql"
    --endpoint "$ENDPOINT"
    --operations "$OPERATIONS_DIR/"
    --header "apollographql-client-name: $CLIENT_NAME"
)

# Add introspection flag if not disabled
if [ "$DISABLE_INTROSPECTION" != "true" ]; then
    debug_echo "Introspection enabled"
    APOLLO_ARGS+=(--introspection)
else
    debug_echo "Introspection disabled by DISABLE_INTROSPECTION environment variable"
fi

# Add mutations control
debug_echo "Setting mutations control to: $ALLOW_MUTATIONS"
APOLLO_ARGS+=(--allow-mutations "$ALLOW_MUTATIONS")

# Add debug logging if enabled
if [ "$MCP_DEBUG" = "true" ]; then
    APOLLO_ARGS+=(--log DEBUG)
fi

# Add user directory if specified
if [ -n "$USER_DIRECTORY" ]; then
    debug_echo "Adding user directory: $USER_DIRECTORY"
    APOLLO_ARGS+=(--directory "$USER_DIRECTORY")
fi

# Add auth header if available
if [ -n "$AUTH_HEADER" ]; then
    APOLLO_ARGS+=(--header "$AUTH_HEADER")
fi

# Start Apollo MCP Server with configuration
apollo-mcp-server "${APOLLO_ARGS[@]}"
