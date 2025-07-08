/**
 * Example usage of Recipe Inventory Analyzer
 * This demonstrates how to efficiently analyze recipe inventory for any recipe/location combination
 */

import RecipeInventoryAnalyzer from './RecipeInventoryAnalyzer.js';

// Mock galley execute function (replace with actual implementation)
async function galleyExecute({ query, variables }) {
  // This would be your actual Galley GraphQL execution
  // For example: return await galley.execute({ query, variables });
  console.log('Executing query:', query.split('\n')[1].trim());
  console.log('Variables:', variables);
  
  // Return mock data structure
  return { data: { viewer: {} } };
}

async function runAnalysis() {
  const analyzer = new RecipeInventoryAnalyzer(galleyExecute);
  
  try {
    console.log('🚀 Starting Recipe Inventory Analysis...\n');
    
    // Example 1: Check if San Diego can make 100 Galley Burgers
    console.log('📝 Example 1: Large batch analysis');
    const largeBatch = await analyzer.analyzeRecipeInventory(
      "Galley Burger",    // Recipe name
      "San Diego",        // Location name  
      100                 // Target quantity
    );
    
    // Example 2: Check smaller quantity
    console.log('\n📝 Example 2: Small batch analysis');
    const smallBatch = await analyzer.analyzeRecipeInventory(
      "Galley Burger",
      "San Diego", 
      10
    );
    
    // Example 3: Different recipe and location
    console.log('\n📝 Example 3: Different recipe');
    const differentRecipe = await analyzer.analyzeRecipeInventory(
      "Caesar Salad",
      "Los Angeles",
      50
    );
    
    console.log('✅ Analysis complete!');
    
    return {
      largeBatch,
      smallBatch, 
      differentRecipe
    };
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Alternative: Direct GraphQL approach for custom analysis
async function directGraphQLExample() {
  console.log('\n🔧 Direct GraphQL Approach:');
  
  // Step 1: Find recipe using existing getRecipesByName operation
  const getRecipesByNameQuery = `
    query GetRecipesByName($name: String!) {
      viewer {
        recipeConnection(
          filters: { name: $name }
          paginationOptions: { startIndex: 0, first: 10 }
        ) {
          edges { 
            node { 
              id, name, description
              yieldUnit { id, name }
              totalYield
            } 
          }
        }
      }
    }`;
    
  const findLocationQuery = `
    query FindLocation($locationName: String!) {
      viewer {
        locationConnection(
          filters: { name: $locationName }
          paginationOptions: { startIndex: 0, first: 1 }
        ) {
          edges { node { id, name } }
        }
      }
    }`;
  
  // Step 2: Get scaled ingredients (example for 50 units)
  const getScaledIngredientsQuery = `
    query GetScaledIngredients($recipeId: String!, $locationId: String!) {
      viewer {
        recipe(id: $recipeId, locationId: $locationId) {
          recipeTreeComponents(
            scaledYield: 50
            scaledUnitId: "dW5pdDoxNA=="
            levels: [-1]
          ) {
            ingredient { id, name }
            quantity
            unit { name }
          }
        }
      }
    }`;
  
  // Step 3: Get vendor items and inventory
  const getInventoryQuery = `
    query GetInventory($vendorItemIds: [String!]!, $locationId: String!) {
      viewer {
        vendorItemConnection(
          filters: { id: $vendorItemIds }
          paginationOptions: { startIndex: 0, first: 50 }
        ) {
          edges {
            node {
              id, name, sku
              inventoryItems(locationIds: [$locationId]) {
                onHand {
                  quantity
                  unit { name }
                }
              }
            }
          }
        }
      }
    }`;
  
  console.log('📋 Use these existing operations in sequence:');
  console.log('1. getRecipesByName (existing operation)');
  console.log('2. findLocationByName'); 
  console.log('3. getScaledRecipeTree');
  console.log('4. getIngredientVendorItems');
  console.log('5. getVendorItemsInventory');
}

// Utility function for batch analysis
async function batchAnalysis(recipes, location, quantities) {
  const analyzer = new RecipeInventoryAnalyzer(galleyExecute);
  const results = [];
  
  for (const recipe of recipes) {
    for (const quantity of quantities) {
      try {
        const result = await analyzer.analyzeRecipeInventory(recipe, location, quantity);
        results.push({
          recipe,
          quantity,
          canProduce: result.summary.canProduce,
          issues: result.criticalIssues.length
        });
      } catch (error) {
        results.push({
          recipe,
          quantity,
          error: error.message
        });
      }
    }
  }
  
  console.log('\n📊 Batch Analysis Results:');
  console.table(results);
  
  return results;
}

// Example batch analysis
async function exampleBatchAnalysis() {
  console.log('\n🔄 Running batch analysis...');
  
  const recipes = ['Galley Burger', 'Caesar Salad', 'Margherita Pizza'];
  const quantities = [10, 50, 100];
  const location = 'San Diego';
  
  await batchAnalysis(recipes, location, quantities);
}

// Export for use in other modules
export {
  runAnalysis,
  directGraphQLExample,
  batchAnalysis,
  exampleBatchAnalysis
};

// Run if this file is executed directly
if (import.meta.main) {
  await runAnalysis();
  await directGraphQLExample();
  await exampleBatchAnalysis();
}