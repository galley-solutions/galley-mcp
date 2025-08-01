# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides GraphQL API integration with Galley's restaurant management system. The server uses Apollo MCP Server with mandatory automatic schema introspection and runs as a containerized service.

## Architecture

### Core Components

**Container Infrastructure:**
- `Dockerfile`: Multi-stage build using Debian Slim base image with Apollo MCP Server and Rover CLI
- `entrypoint.sh`: Main startup script that handles authentication, schema introspection, and server launch
- `introspect-schema.sh`: Schema introspection script using Rover CLI

**GraphQL Operations (`/operations/`):**
- **Pre-built queries**: 15+ production-ready GraphQL operations for recipes, inventory, locations, and menu plans
- **Constants module**: `galley_constants.js` with comprehensive API constants, units, error messages, and utilities
- **Inventory analyzer**: `RecipeInventoryAnalyzer.js` - sophisticated class for analyzing recipe production feasibility
- **Usage examples**: `usage_example.js` demonstrating analyzer patterns and batch operations

### Authentication Flow

Three authentication methods with priority order:
1. `X_API_KEY` (X-API-KEY header) - highest priority
2. `X_USER_API_KEY` (x-user-api-key header) - medium priority  
3. `GALLEY_AUTH_TOKEN` (Bearer token) - lowest priority

Both `entrypoint.sh` and `introspect-schema.sh` implement identical authentication logic.

### GraphQL Schema System

- **Mandatory introspection**: Server performs schema introspection on startup using Rover CLI
- **Production/Staging support**: Environment-based endpoint switching
- **Schema caching**: Downloaded schema stored at `/app/schema.graphql`
- **Operation validation**: All operations validated against introspected schema

## Development Commands

### Docker Operations
```bash
# Build image
docker build -t galley-mcp .

# Run with authentication (choose one)
docker run -i -e X_API_KEY="key" galley-mcp
docker run -i -e X_USER_API_KEY="key" galley-mcp  
docker run -i -e GALLEY_AUTH_TOKEN="token" galley-mcp

# Run with staging environment
docker run -i -e X_API_KEY="key" -e STAGING=true galley-mcp

# Run with debug logging
docker run -i -e X_API_KEY="key" -e MCP_DEBUG=true galley-mcp

# Mount custom operations directory
docker run -i -e X_API_KEY="key" -v /path/to/operations:/app/user_operations -e USER_OPERATIONS_DIR=/app/user_operations galley-mcp
```

### Mutation Control
```bash
# Allow no mutations (default)
docker run -i -e X_API_KEY="key" -e ALLOW_MUTATIONS=none galley-mcp

# Allow explicit mutations only
docker run -i -e X_API_KEY="key" -e ALLOW_MUTATIONS=explicit galley-mcp

# Allow all mutations
docker run -i -e X_API_KEY="key" -e ALLOW_MUTATIONS=all galley-mcp
```

### Testing and Debugging
```bash
# Test schema introspection manually
docker run --rm -e X_API_KEY="key" galley-mcp ./introspect-schema.sh

# Check connectivity
docker run --rm -e X_API_KEY="key" galley-mcp ping -c 3 app.galleysolutions.com

# Inspect generated schema
docker run --rm -e X_API_KEY="key" galley-mcp ls -la /app/schema.graphql
```

## Key GraphQL Operations

### Recipe Operations
- `GetRecipesByName.graphql`: Find recipes by name with ingredient details
- `getRecipeDetails.graphql`: Get comprehensive recipe information
- `getScaledRecipeTree.graphql`: Get scaled ingredient requirements for production
- `getScaledRecipeForProduction.graphql`: Production-specific recipe scaling

### Inventory & Vendor Operations  
- `getVendorItemsInventory.graphql`: Check inventory levels for vendor items
- `getIngredientVendorItems.graphql`: Find vendor items for specific ingredients
- `RecipeInventoryAnalyzer.js`: Complete inventory analysis for recipe production

### Location & Menu Operations
- `findLocationByName.graphql`: Locate facilities by name
- `getLocationDetails.graphql`: Get detailed location information
- `findMenuPlanByName.graphql`: Find menu plans
- `getCompleteMenuPlanData.graphql`: Comprehensive menu plan data
- `batchMenuPlanAnalysis.graphql`: Analyze multiple menu plans

### Nutritional Operations
- `getRecipeNutritionalInfo.graphql`: Get nutritional data for recipes
- `getCompanyEnabledNutrients.graphql`: Get company-specific nutrient requirements

## Working with Operations

### Using RecipeInventoryAnalyzer
```javascript
import RecipeInventoryAnalyzer from './operations/RecipeInventoryAnalyzer.js';

const analyzer = new RecipeInventoryAnalyzer(galleyExecute);
const result = await analyzer.analyzeRecipeInventory(
  "Galley Burger",    // Recipe name
  "San Diego",        // Location name
  100                 // Target quantity
);
```

### Using Constants
```javascript
import { UNITS, ERROR_MESSAGES, UTILS } from './operations/galley_constants.js';

// Use predefined unit IDs
const quantity = { amount: 2, unitId: UNITS.KILOGRAM };

// Use error messages
throw new Error(ERROR_MESSAGES.RECIPE_NOT_FOUND("Burger"));

// Use utility functions
if (UTILS.isValidQuantity(targetQty)) { /* ... */ }
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `X_API_KEY` | Galley X-API-KEY authentication | - | * |
| `X_USER_API_KEY` | Galley x-user-api-key authentication | - | * |  
| `GALLEY_AUTH_TOKEN` | Galley Bearer token authentication | - | * |
| `STAGING` | Use staging environment endpoints | `false` | No |
| `ENDPOINT` | GraphQL endpoint URL | `https://app.galleysolutions.com/graphql` | No |
| `INTROSPECT_ENDPOINT` | Schema introspection endpoint | Same as `ENDPOINT` | No |
| `USER_DIRECTORY` | Additional operations directory | - | No |
| `MCP_DEBUG` | Enable debug mode with verbose logging | `false` | No |
| `DISABLE_INTROSPECTION` | Disable introspection capability | `false` | No |
| `ALLOW_MUTATIONS` | Control mutation permissions | `none` | No |

## Working with the Codebase

### Adding New Operations
1. Create `.graphql` files in `/operations/` directory
2. Follow existing naming conventions (`getResourceByField.graphql`)
3. Use constants from `galley_constants.js` for units and IDs
4. Test with appropriate authentication

### Modifying Authentication
- Authentication logic exists in both `entrypoint.sh` and `introspect-schema.sh`
- Maintain priority order: X_API_KEY > X_USER_API_KEY > GALLEY_AUTH_TOKEN
- Update both files and README.md documentation

### Schema Management
- Schema introspection is mandatory and automatic
- Schema file stored at `/app/schema.graphql`
- Rover CLI handles GraphQL schema introspection
- No manual schema files needed

## Production Deployment

The project uses Amazon ECR Public Gallery for container distribution:
- Registry: `public.ecr.aws/o0r1r5q2/galley-mcp`
- Multi-architecture support: `linux/amd64`, `linux/arm64`
- Automatic builds on master branch commits
- Semantic versioning with git tags