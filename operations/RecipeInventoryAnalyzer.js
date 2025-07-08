/**
 * Recipe Inventory Analyzer
 * Efficiently analyzes if a location has enough inventory to produce a specified quantity of a recipe
 */
class RecipeInventoryAnalyzer {
  constructor(galleyExecute) {
    this.execute = galleyExecute;
  }

  /**
   * Main method to analyze recipe inventory requirements
   * @param {string} recipeName - Name of the recipe to analyze
   * @param {string} locationName - Name of the location
   * @param {number} targetQuantity - Number of items to produce
   * @param {string} targetUnitId - Unit ID for target quantity (default: "dW5pdDoxNA==" for "each")
   */
  async analyzeRecipeInventory(recipeName, locationName, targetQuantity, targetUnitId = "dW5pdDoxNA==") {
    try {
      console.log(`🔍 Analyzing inventory for ${targetQuantity} ${recipeName} at ${locationName}...`);
      
      // Step 1: Find location
      const location = await this.findLocation(locationName);
      if (!location) {
        throw new Error(`Location "${locationName}" not found`);
      }
      
      // Step 2: Find recipe
      const recipe = await this.findRecipe(recipeName);
      if (!recipe) {
        throw new Error(`Recipe "${recipeName}" not found`);
      }
      
      // Step 3: Get scaled ingredients
      const scaledIngredients = await this.getScaledIngredients(recipe.id, location.id, targetQuantity, targetUnitId);
      
      // Step 4: Get vendor items for ingredients
      const ingredientVendorItems = await this.getIngredientVendorItems(scaledIngredients, location.id);
      
      // Step 5: Get inventory for vendor items
      const inventory = await this.getVendorItemInventory(ingredientVendorItems, location.id);
      
      // Step 6: Analyze sufficiency
      const analysis = this.performSufficiencyAnalysis(scaledIngredients, inventory);
      
      // Step 7: Generate report
      return this.generateReport(recipeName, locationName, targetQuantity, analysis);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  async findLocation(locationName) {
    const query = `
      query FindLocationByName($locationName: String!) {
        viewer {
          locationConnection(
            filters: { name: $locationName }
            paginationOptions: { startIndex: 0, first: 10 }
          ) {
            edges {
              node { id, name, city, state }
            }
          }
        }
      }`;
    
    const result = await this.execute({ query, variables: { locationName } });
    const locations = result.data.viewer.locationConnection.edges;
    
    return locations.length > 0 ? locations[0].node : null;
  }

  async findRecipe(recipeName) {
    // Use the existing getRecipesByName operation
    const result = await this.execute({
      query: `
        query GetRecipesByName($name: String!) {
          viewer {
            recipeConnection(
              filters: {
                name: $name
              }
              paginationOptions: {
                startIndex: 0
                first: 10
              }
            ) {
              totalCount
              edges {
                node {
                  id
                  name
                  description
                  yieldUnit {
                    id
                    name
                  }
                  totalYield
                }
              }
            }
          }
        }`,
      variables: { name: recipeName }
    });
    
    const recipes = result.data.viewer.recipeConnection.edges;
    
    if (recipes.length === 0) {
      return null;
    }
    
    // If multiple recipes found, prioritize exact match or first result
    const exactMatch = recipes.find(edge => 
      edge.node.name.toLowerCase() === recipeName.toLowerCase()
    );
    
    return exactMatch ? exactMatch.node : recipes[0].node;
  }

  async getScaledIngredients(recipeId, locationId, scaledYield, scaledUnitId) {
    const query = `
      query GetScaledRecipeTree($recipeId: String!, $locationId: String!, $scaledYield: Float!, $scaledUnitId: String!) {
        viewer {
          recipe(id: $recipeId, locationId: $locationId) {
            id, name
            yieldUnit { id, name }
            totalYield
            recipeTreeComponents(
              scaledYield: $scaledYield
              scaledUnitId: $scaledUnitId
              levels: [-1]
            ) {
              id
              ingredient { id, name }
              quantity
              unit { id, name }
            }
          }
        }
      }`;
    
    const result = await this.execute({
      query,
      variables: { recipeId, locationId, scaledYield, scaledUnitId }
    });
    
    return result.data.viewer.recipe.recipeTreeComponents;
  }

  async getIngredientVendorItems(scaledIngredients, locationId) {
    const ingredientIds = [...new Set(scaledIngredients.map(comp => comp.ingredient.id))];
    
    const query = `
      query GetIngredientVendorItems($ingredientIds: [String!]!, $locationId: String!) {
        viewer {
          ingredientConnection(
            filters: { id: $ingredientIds }
            paginationOptions: { startIndex: 0, first: 50 }
          ) {
            edges {
              node {
                id, name
                vendorItems(locationId: $locationId) {
                  id, name, sku
                }
              }
            }
          }
        }
      }`;
    
    const result = await this.execute({ query, variables: { ingredientIds, locationId } });
    
    const vendorItemMap = new Map();
    result.data.viewer.ingredientConnection.edges.forEach(edge => {
      const ingredient = edge.node;
      ingredient.vendorItems.forEach(vendorItem => {
        vendorItemMap.set(vendorItem.id, {
          ...vendorItem,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name
        });
      });
    });
    
    return vendorItemMap;
  }

  async getVendorItemInventory(vendorItemMap, locationId) {
    const vendorItemIds = Array.from(vendorItemMap.keys());
    
    if (vendorItemIds.length === 0) {
      return new Map();
    }
    
    const query = `
      query GetVendorItemsInventory($vendorItemIds: [String!]!, $locationId: String!) {
        viewer {
          vendorItemConnection(
            filters: { id: $vendorItemIds }
            paginationOptions: { startIndex: 0, first: 100 }
          ) {
            edges {
              node {
                id, name, sku
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
      }`;
    
    const result = await this.execute({ query, variables: { vendorItemIds, locationId } });
    
    const inventoryMap = new Map();
    result.data.viewer.vendorItemConnection.edges.forEach(edge => {
      const vendorItem = edge.node;
      const vendorItemInfo = vendorItemMap.get(vendorItem.id);
      
      inventoryMap.set(vendorItem.id, {
        ...vendorItem,
        ingredientId: vendorItemInfo.ingredientId,
        ingredientName: vendorItemInfo.ingredientName,
        inventory: vendorItem.inventoryItems[0]?.onHand || { quantity: 0, unit: null }
      });
    });
    
    return inventoryMap;
  }

  performSufficiencyAnalysis(scaledIngredients, inventory) {
    const analysis = {
      requirements: [],
      sufficient: [],
      insufficient: [],
      missing: [],
      canProduce: true,
      criticalIssues: []
    };

    scaledIngredients.forEach(component => {
      const requirement = {
        ingredientId: component.ingredient.id,
        ingredientName: component.ingredient.name,
        requiredQuantity: component.quantity,
        requiredUnit: component.unit.name
      };
      
      analysis.requirements.push(requirement);
      
      // Find vendor items for this ingredient
      const vendorItems = Array.from(inventory.values())
        .filter(item => item.ingredientId === component.ingredient.id);
      
      if (vendorItems.length === 0) {
        analysis.missing.push({
          ...requirement,
          issue: "No vendor items found"
        });
        analysis.canProduce = false;
        analysis.criticalIssues.push(`${requirement.ingredientName}: No vendor items available`);
        return;
      }
      
      // Check if any vendor item has positive inventory
      const hasPositiveInventory = vendorItems.some(item => item.inventory.quantity > 0);
      
      if (!hasPositiveInventory) {
        analysis.insufficient.push({
          ...requirement,
          availableItems: vendorItems,
          issue: "No positive inventory"
        });
        analysis.canProduce = false;
        analysis.criticalIssues.push(`${requirement.ingredientName}: No positive inventory available`);
      } else {
        analysis.sufficient.push({
          ...requirement,
          availableItems: vendorItems.filter(item => item.inventory.quantity > 0)
        });
      }
    });

    return analysis;
  }

  generateReport(recipeName, locationName, targetQuantity, analysis) {
    const report = {
      summary: {
        recipe: recipeName,
        location: locationName,
        targetQuantity,
        canProduce: analysis.canProduce,
        totalIngredients: analysis.requirements.length,
        sufficientIngredients: analysis.sufficient.length,
        insufficientIngredients: analysis.insufficient.length,
        missingIngredients: analysis.missing.length
      },
      requirements: analysis.requirements,
      inventory: {
        sufficient: analysis.sufficient,
        insufficient: analysis.insufficient,
        missing: analysis.missing
      },
      criticalIssues: analysis.criticalIssues,
      recommendations: this.generateRecommendations(analysis)
    };

    // Console output
    this.printReport(report);
    
    return report;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (!analysis.canProduce) {
      recommendations.push("🚨 URGENT: Cannot produce requested quantity");
      
      if (analysis.missing.length > 0) {
        recommendations.push("📋 Set up vendor items for missing ingredients");
      }
      
      if (analysis.insufficient.length > 0) {
        recommendations.push("📦 Restock ingredients with insufficient inventory");
        
        // Check for negative inventory
        const negativeInventory = analysis.insufficient.filter(item =>
          item.availableItems?.some(vendorItem => vendorItem.inventory.quantity < 0)
        );
        
        if (negativeInventory.length > 0) {
          recommendations.push("🔍 Investigate negative inventory levels - possible tracking issues");
        }
      }
    } else {
      recommendations.push("✅ Production possible with current inventory");
      recommendations.push("📊 Monitor stock levels during production");
    }
    
    return recommendations;
  }

  printReport(report) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 INVENTORY ANALYSIS REPORT`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Recipe: ${report.summary.recipe}`);
    console.log(`Location: ${report.summary.location}`);
    console.log(`Target Quantity: ${report.summary.targetQuantity}`);
    console.log(`Can Produce: ${report.summary.canProduce ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\n📋 INGREDIENT SUMMARY:`);
    console.log(`• Total ingredients: ${report.summary.totalIngredients}`);
    console.log(`• Sufficient: ${report.summary.sufficientIngredients}`);
    console.log(`• Insufficient: ${report.summary.insufficientIngredients}`);
    console.log(`• Missing: ${report.summary.missingIngredients}`);
    
    if (report.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      report.criticalIssues.forEach(issue => console.log(`• ${issue}`));
    }
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    report.recommendations.forEach(rec => console.log(`• ${rec}`));
    
    console.log(`\n${'='.repeat(60)}\n`);
  }
}

// Usage example:
/*
const analyzer = new RecipeInventoryAnalyzer(galleyExecute);

// Analyze if San Diego can make 100 Galley Burgers
const result = await analyzer.analyzeRecipeInventory(
  "Galley Burger",
  "San Diego", 
  100
);

// Check different quantities
const smallBatch = await analyzer.analyzeRecipeInventory(
  "Galley Burger",
  "San Diego", 
  10
);
*/

export default RecipeInventoryAnalyzer;