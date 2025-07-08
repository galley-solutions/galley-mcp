/**
 * Galley API Constants
 * Common unit IDs, query limits, and other constants used across operations
 */

// Common Unit IDs (base64 encoded)
export const UNITS = {
  // Count/Quantity Units
  EACH: "dW5pdDoxNA==",        // each
  DOZEN: "dW5pdDo0NjgzNzA=",   // dozen
  
  // Weight Units
  GRAM: "dW5pdDox",            // g
  KILOGRAM: "dW5pdDoy",        // kg  
  OUNCE: "dW5pdDoz",           // oz
  POUND: "dW5pdDo0",           // lb
  
  // Volume Units
  MILLILITER: "dW5pdDo2",      // ml
  LITER: "dW5pdDo1",           // L
  TEASPOON: "dW5pdDo3",        // tsp
  TABLESPOON: "dW5pdDo4",      // tbsp
  CUP: "dW5pdDoxMw==",         // cup
  GALLON: "dW5pdDoxMQ==",      // gal
  
  // Packaging Units
  CASE: "dW5pdDoxMDcxNjQ=",    // case
  PACK: "dW5pdDo5MzEwMTA=",    // pack
  JAR: "dW5pdDoxMA==",         // jar
  CONTAINER: "dW5pdDoxMDc2OTA=" // container
};

// Default pagination settings
export const PAGINATION = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
  DEFAULT_START: 0
};

// Recipe tree analysis settings  
export const RECIPE_TREE = {
  LEAF_NODES_LEVEL: [-1],      // Gets only ingredient components (leaf nodes)
  ALL_LEVELS: [],              // Gets all levels
  TOP_LEVEL_ONLY: [0]          // Gets only top-level items
};

// Common location names (can be extended)
export const COMMON_LOCATIONS = {
  SAN_DIEGO: "San Diego",
  LOS_ANGELES: "Los Angeles", 
  SAN_FRANCISCO: "San Francisco",
  CHICAGO: "Chicago",
  NEW_YORK: "New York"
};

// Query operation types
export const OPERATIONS = {
  FIND_RECIPE: 'findRecipe',
  FIND_LOCATION: 'findLocation', 
  GET_SCALED_INGREDIENTS: 'getScaledIngredients',
  GET_VENDOR_ITEMS: 'getVendorItems',
  GET_INVENTORY: 'getInventory'
};

// Analysis result status
export const ANALYSIS_STATUS = {
  SUFFICIENT: 'sufficient',
  INSUFFICIENT: 'insufficient', 
  MISSING: 'missing',
  ERROR: 'error'
};

// Inventory status indicators
export const INVENTORY_STATUS = {
  POSITIVE: 'positive',       // Quantity > 0
  ZERO: 'zero',              // Quantity = 0
  NEGATIVE: 'negative'       // Quantity < 0 (tracking issue)
};

// Common recipe yield units
export const YIELD_UNITS = {
  BURGER: "dW5pdDo0MzQzNTU=",     // burger
  SERVING: "dW5pdDoxNA==",        // each (serving)
  PORTION: "dW5pdDoxNA==",        // each (portion)
  PLATE: "dW5pdDoxNA==",          // each (plate)
};

// Error messages
export const ERROR_MESSAGES = {
  RECIPE_NOT_FOUND: (name) => `Recipe "${name}" not found`,
  LOCATION_NOT_FOUND: (name) => `Location "${name}" not found`,
  NO_INGREDIENTS: 'No ingredients found in recipe',
  NO_VENDOR_ITEMS: 'No vendor items found for ingredients',
  API_ERROR: 'Galley API request failed',
  INVALID_QUANTITY: 'Target quantity must be greater than 0'
};

// Success messages
export const SUCCESS_MESSAGES = {
  CAN_PRODUCE: '✅ Production possible with current inventory',
  ANALYSIS_COMPLETE: '📊 Inventory analysis completed successfully',
  SUFFICIENT_STOCK: '📦 All ingredients have sufficient stock'
};

// Warning messages
export const WARNING_MESSAGES = {
  NEGATIVE_INVENTORY: '⚠️ Negative inventory detected - check for tracking issues',
  LOW_STOCK: '📉 Low stock levels detected',
  MULTIPLE_VENDORS: '🔄 Multiple vendor options available',
  UNIT_CONVERSION_NEEDED: '🔢 Unit conversion may be required',
  PARTIAL_AVAILABILITY: '⚪ Some ingredients available, others missing'
};

// Report formatting
export const REPORT_FORMAT = {
  DIVIDER: '='.repeat(60),
  SECTION_DIVIDER: '-'.repeat(40),
  BULLET: '•',
  CHECK_MARK: '✅',
  X_MARK: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️'
};

// Unit conversion helpers (approximate conversions for display)
export const UNIT_CONVERSIONS = {
  // Weight conversions to grams
  WEIGHT_TO_GRAMS: {
    'oz': 28.35,
    'lb': 453.59,
    'kg': 1000,
    'g': 1
  },
  
  // Volume conversions to milliliters
  VOLUME_TO_ML: {
    'tsp': 4.93,
    'tbsp': 14.79,
    'cup': 236.59,
    'gal': 3785.41,
    'ml': 1,
    'L': 1000
  },
  
  // Common packaging estimates (items per case/pack)
  PACKAGING_ESTIMATES: {
    'buns_per_case': 48,
    'bottles_per_case': 12,
    'cans_per_case': 24,
    'jars_per_case': 12
  }
};

// Query templates for common operations
export const QUERY_TEMPLATES = {
  GET_RECIPES_BY_NAME: `
    query GetRecipesByName($name: String!) {
      viewer {
        recipeConnection(
          filters: { name: $name }
          paginationOptions: { startIndex: 0, first: 5 }
        ) {
          edges {
            node {
              id
              name
              description
              yieldUnit { id, name }
              totalYield
            }
          }
        }
      }
    }`,
    
  BASIC_LOCATION_SEARCH: `
    query FindLocation($name: String!) {
      viewer {
        locationConnection(
          filters: { name: $name }
          paginationOptions: { startIndex: 0, first: 5 }
        ) {
          edges {
            node {
              id
              name
              city
              state
            }
          }
        }
      }
    }`,
    
  INVENTORY_CHECK: `
    query CheckInventory($vendorItemIds: [String!]!, $locationId: String!) {
      viewer {
        vendorItemConnection(
          filters: { id: $vendorItemIds }
          paginationOptions: { startIndex: 0, first: 50 }
        ) {
          edges {
            node {
              id
              name
              sku
              inventoryItems(locationIds: [$locationId]) {
                onHand {
                  quantity
                  unit { id, name }
                }
              }
            }
          }
        }
      }
    }`
};

// Validation rules
export const VALIDATION = {
  MIN_QUANTITY: 0.01,
  MAX_QUANTITY: 10000,
  MAX_RECIPE_NAME_LENGTH: 100,
  MAX_LOCATION_NAME_LENGTH: 100,
  REQUIRED_FIELDS: ['recipeName', 'locationName', 'targetQuantity']
};

// Analysis thresholds
export const THRESHOLDS = {
  LOW_STOCK_PERCENTAGE: 0.1,     // 10% or less considered low stock
  CRITICAL_STOCK_PERCENTAGE: 0.05, // 5% or less considered critical
  ZERO_TOLERANCE: 0.001          // Values below this considered zero
};

// Default analysis options
export const DEFAULT_OPTIONS = {
  INCLUDE_ZERO_INVENTORY: false,
  INCLUDE_NEGATIVE_INVENTORY: true,
  SHOW_VENDOR_DETAILS: true,
  SHOW_UNIT_CONVERSIONS: false,
  VERBOSE_OUTPUT: false
};

// Export utility functions
export const UTILS = {
  // Check if inventory is sufficient
  isInventorySufficient: (available, required) => available >= required,
  
  // Check if inventory is negative
  isNegativeInventory: (quantity) => quantity < 0,
  
  // Check if inventory is low
  isLowInventory: (quantity, threshold = THRESHOLDS.LOW_STOCK_PERCENTAGE) => 
    quantity > 0 && quantity <= threshold,
    
  // Format quantity for display
  formatQuantity: (quantity, unit) => 
    `${quantity.toFixed(2)} ${unit || 'units'}`,
    
  // Generate unique operation ID
  generateOperationId: () => 
    `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    
  // Validate recipe name
  isValidRecipeName: (name) => 
    name && typeof name === 'string' && name.length <= VALIDATION.MAX_RECIPE_NAME_LENGTH,
    
  // Validate location name  
  isValidLocationName: (name) =>
    name && typeof name === 'string' && name.length <= VALIDATION.MAX_LOCATION_NAME_LENGTH,
    
  // Validate target quantity
  isValidQuantity: (quantity) =>
    typeof quantity === 'number' && 
    quantity >= VALIDATION.MIN_QUANTITY && 
    quantity <= VALIDATION.MAX_QUANTITY
};

// Export all constants as default
export default {
  UNITS,
  PAGINATION,
  RECIPE_TREE,
  COMMON_LOCATIONS,
  OPERATIONS,
  ANALYSIS_STATUS,
  INVENTORY_STATUS,
  YIELD_UNITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  WARNING_MESSAGES,
  REPORT_FORMAT,
  UNIT_CONVERSIONS,
  QUERY_TEMPLATES,
  VALIDATION,
  THRESHOLDS,
  DEFAULT_OPTIONS,
  UTILS
};