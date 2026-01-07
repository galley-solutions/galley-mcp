/**
 * Nutrition Label Generation Example
 *
 * This example demonstrates how to generate FDA-compliant nutrition labels
 * for recipes using the GetRecipeNutritionLabel operation.
 */

import fs from 'fs';

/**
 * Workflow for generating a nutrition label:
 *
 * 1. Get recipe ID (from user or by searching with GetRecipesByName)
 * 2. Get location ID (if not provided, list locations and ask user)
 * 3. Generate nutrition label with customizable options
 * 4. Ask user if they want to save or just return the label
 * 5. If saving, ask for format (SVG or PNG/HTML with data URI)
 */

// Example 1: Basic nutrition label generation
async function generateNutritionLabel(galleyExecute, recipeId, locationId) {
  const result = await galleyExecute({
    operation: 'GetRecipeNutritionLabel',
    variables: {
      recipeId,
      locationId,
      // Using defaults:
      // labelType: VERTICAL
      // showAllergens: true
      // showIngredients: true
      // showProteinDV: true
      // showServingsPerContainer: true
      // showRecipeName: true
    }
  });

  return result.data.viewer.recipe.nutritionLabel;
}

// Example 2: Generate horizontal label without recipe name
async function generateHorizontalLabel(galleyExecute, recipeId, locationId) {
  const result = await galleyExecute({
    operation: 'GetRecipeNutritionLabel',
    variables: {
      recipeId,
      locationId,
      labelType: 'HORIZONTAL',
      showRecipeName: false
    }
  });

  return result.data.viewer.recipe.nutritionLabel;
}

// Example 3: Custom serving size override
async function generateCustomServingLabel(galleyExecute, recipeId, locationId) {
  const result = await galleyExecute({
    operation: 'GetRecipeNutritionLabel',
    variables: {
      recipeId,
      locationId,
      servingSizeQuantity: 0.5,
      servingSizeUnit: {
        id: "dW5pdDo0MzQzNTU=",
        name: "burger"
      },
      servingsPerContainer: 2
    }
  });

  return result.data.viewer.recipe.nutritionLabel;
}

// Example 4: Complete workflow with location selection and save options
async function generateLabelWithLocationSelection(galleyExecute, recipeName, options = {}) {
  // Step 1: Find recipe by name
  const recipeResult = await galleyExecute({
    operation: 'GetRecipesByName',
    variables: { name: recipeName }
  });

  const recipes = recipeResult.data.viewer.recipeConnection.edges;

  if (recipes.length === 0) {
    throw new Error(`Recipe "${recipeName}" not found`);
  }

  const recipeId = recipes[0].node.id;
  console.log(`Found recipe: ${recipes[0].node.name} (${recipeId})`);

  // Step 2: Get available locations
  const locationResult = await galleyExecute({
    operation: 'FindLocationByName',
    variables: { locationName: '' } // Empty string to get all locations
  });

  const locations = locationResult.data.viewer.locationConnection.edges;

  if (locations.length === 0) {
    throw new Error('No locations found in account');
  }

  // If multiple locations, user should select one
  let locationId;
  if (locations.length === 1) {
    locationId = locations[0].node.id;
    console.log(`Using location: ${locations[0].node.name}`);
  } else {
    console.log('Available locations:');
    locations.forEach((loc, index) => {
      console.log(`  ${index + 1}. ${loc.node.name} (${loc.node.city}, ${loc.node.state})`);
    });

    // In a real application, prompt user to select location
    // For this example, use the first location
    locationId = locations[0].node.id;
    console.log(`Using location: ${locations[0].node.name}`);
  }

  // Step 3: Generate nutrition label
  const labelResult = await galleyExecute({
    operation: 'GetRecipeNutritionLabel',
    variables: {
      recipeId,
      locationId,
      ...options // Allow passing custom options
    }
  });

  const label = labelResult.data.viewer.recipe.nutritionLabel;
  const recipe = labelResult.data.viewer.recipe;

  // Step 4: Ask user if they want to save or just return
  // options.saveLabel: true/false (default: false - just return)
  // options.saveFormat: 'svg' | 'html' (default: 'svg')

  if (options.saveLabel) {
    const format = options.saveFormat || 'svg';
    let filename;

    if (format === 'svg') {
      // Save as SVG file
      filename = `${recipeName.replace(/\s+/g, '_')}_nutrition_label.svg`;
      fs.writeFileSync(filename, label.svg);
      console.log(`Nutrition label saved as SVG: ${filename}`);
    } else if (format === 'html') {
      // Save as HTML file with embedded data URI
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${recipe.name} - Nutrition Label</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <img src="${label.dataURI}" alt="${recipe.name} Nutrition Label" />
</body>
</html>`;
      filename = `${recipeName.replace(/\s+/g, '_')}_nutrition_label.html`;
      fs.writeFileSync(filename, htmlContent);
      console.log(`Nutrition label saved as HTML: ${filename}`);
    }

    return {
      svg: label.svg,
      dataURI: label.dataURI,
      filename,
      format
    };
  }

  // Just return the label data
  return {
    svg: label.svg,
    dataURI: label.dataURI,
    recipeName: recipe.name,
    recipeId: recipe.id
  };
}

// Example 5: Batch generate labels for multiple recipes at a location
async function batchGenerateLabels(galleyExecute, recipeIds, locationId, saveOptions = {}) {
  const labels = [];

  for (const recipeId of recipeIds) {
    const result = await galleyExecute({
      operation: 'GetRecipeNutritionLabel',
      variables: {
        recipeId,
        locationId
      }
    });

    const recipe = result.data.viewer.recipe;
    const labelData = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      svg: recipe.nutritionLabel.svg,
      dataURI: recipe.nutritionLabel.dataURI
    };

    // Save if requested
    if (saveOptions.saveLabel) {
      const format = saveOptions.saveFormat || 'svg';
      const filename = `${recipe.name.replace(/\s+/g, '_')}_nutrition_label.${format}`;

      if (format === 'svg') {
        fs.writeFileSync(filename, recipe.nutritionLabel.svg);
      } else if (format === 'html') {
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${recipe.name} - Nutrition Label</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <img src="${recipe.nutritionLabel.dataURI}" alt="${recipe.name} Nutrition Label" />
</body>
</html>`;
        fs.writeFileSync(filename, htmlContent);
      }

      labelData.filename = filename;
    }

    labels.push(labelData);
  }

  return labels;
}

// Export examples
export {
  generateNutritionLabel,
  generateHorizontalLabel,
  generateCustomServingLabel,
  generateLabelWithLocationSelection,
  batchGenerateLabels
};

/**
 * Usage Notes:
 *
 * Label Types:
 * - VERTICAL: Standard FDA vertical format (default) - best for most packaging
 * - HORIZONTAL: Compact horizontal format - for space-constrained packaging
 *
 * Display Options:
 * - showRecipeName: Include/exclude recipe name at top of label (default: true)
 * - showAllergens: Include/exclude allergen information (default: true)
 * - showIngredients: Include/exclude ingredient list (default: true)
 * - showProteinDV: Include/exclude protein % Daily Value (default: true)
 * - showServingsPerContainer: Include/exclude servings per container (default: true)
 *
 * Serving Size Overrides:
 * - servingSizeQuantity: Override the default serving quantity
 * - servingSizeUnit: Override the default serving unit (must include both id and name)
 * - servingsPerContainer: Override the default servings per container
 *
 * Save Options:
 * - saveLabel: true/false - Whether to save to file (default: false - just return data)
 * - saveFormat: 'svg' | 'html' - Format to save in (default: 'svg')
 *   - 'svg': Pure SVG file that can be opened in browsers/editors
 *   - 'html': HTML file with embedded data URI for easy viewing
 *
 * Output Formats:
 * - svg: Raw SVG markup (can be embedded in HTML or saved to .svg file)
 * - dataURI: Data URI format (can be used in <img> tags)
 *
 * Example Usage:
 *
 * // Just return the label data
 * const label = await generateLabelWithLocationSelection(galleyExecute, "Galley Burger");
 *
 * // Save as SVG file
 * const label = await generateLabelWithLocationSelection(galleyExecute, "Galley Burger", {
 *   saveLabel: true,
 *   saveFormat: 'svg'
 * });
 *
 * // Save as HTML file for easy viewing
 * const label = await generateLabelWithLocationSelection(galleyExecute, "Galley Burger", {
 *   saveLabel: true,
 *   saveFormat: 'html'
 * });
 *
 * // Custom label options with save
 * const label = await generateLabelWithLocationSelection(galleyExecute, "Galley Burger", {
 *   labelType: 'HORIZONTAL',
 *   showRecipeName: false,
 *   saveLabel: true,
 *   saveFormat: 'svg'
 * });
 */
