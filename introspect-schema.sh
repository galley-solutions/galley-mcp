#!/bin/bash

# Debug output function
debug_echo() {
    if [ "$MCP_DEBUG" = "true" ]; then
        echo "$@"
    fi
}

debug_echo "Starting schema introspection..."

# Verify Rover is available
if ! command -v rover &> /dev/null; then
    echo "Error: Rover not found in PATH"
    exit 1
fi

debug_echo "Rover is available"

# Configuration
INTROSPECT_ENDPOINT=${INTROSPECT_ENDPOINT:-"https://app.galleysolutions.com/graphql"}
SCHEMA_OUTPUT=${SCHEMA_OUTPUT:-"/app/schema.graphql"}

debug_echo "Introspecting schema from: $INTROSPECT_ENDPOINT"
debug_echo "Output file: $SCHEMA_OUTPUT"

# Build introspection command
ROVER_ARGS=(
    graph
    introspect
    "$INTROSPECT_ENDPOINT"
    --output "$SCHEMA_OUTPUT"
)

# Add debug logging if enabled
if [ "$MCP_DEBUG" = "true" ]; then
    ROVER_ARGS+=(--log DEBUG)
fi

# Add authentication headers if available
if [ -n "$X_API_KEY" ]; then
    debug_echo "Using X-API-KEY for introspection"
    ROVER_ARGS+=(--header "X-API-KEY:$X_API_KEY")
elif [ -n "$X_USER_API_KEY" ]; then
    debug_echo "Using x-user-api-key for introspection"
    ROVER_ARGS+=(--header "x-user-api-key:$X_USER_API_KEY")
elif [ -n "$GALLEY_AUTH_TOKEN" ]; then
    debug_echo "Using Bearer token for introspection"
    ROVER_ARGS+=(--header "Authorization:Bearer $GALLEY_AUTH_TOKEN")
else
    debug_echo "Warning: No authentication provided for introspection"
fi

# Add client name header
HOSTNAME=$(hostname)
CLIENT_NAME=${APOLLOGRAPHQL_CLIENT_NAME:-"galley-mcp-introspect@$HOSTNAME"}
ROVER_ARGS+=(--header "apollographql-client-name:$CLIENT_NAME")

# Run introspection
debug_echo "Running: rover ${ROVER_ARGS[*]}"
if [ "$MCP_DEBUG" = "true" ]; then
    rover "${ROVER_ARGS[@]}"
else
    rover "${ROVER_ARGS[@]}" >/dev/null 2>&1
fi

if [ $? -eq 0 ]; then
    debug_echo "Schema introspection completed successfully!"
    debug_echo "Schema saved to: $SCHEMA_OUTPUT"
    
    # Show schema stats only in debug mode
    if [ "$MCP_DEBUG" = "true" ] && [ -f "$SCHEMA_OUTPUT" ]; then
        LINES=$(wc -l < "$SCHEMA_OUTPUT")
        SIZE=$(du -h "$SCHEMA_OUTPUT" | cut -f1)
        debug_echo "Schema file: $LINES lines, $SIZE"
    fi
else
    echo "Error: Schema introspection failed"
    exit 1
fi
