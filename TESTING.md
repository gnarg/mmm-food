# Testing

This project uses Jest for unit testing the JavaScript functionality.

## Running Tests

Install dependencies (first time only):
```bash
npm install
```

Run all tests:
```bash
npm test
```

Run tests in watch mode (re-runs on file changes):
```bash
npm run test:watch
```

Run tests with coverage report:
```bash
npm run test:coverage
```

## Test Coverage

The test suite includes **42 tests** covering the following functionality:

### Grams Calculations (15 tests)
- **proteinGrams**: Validates protein gram calculations (25g per serving)
- **carbGrams**: Validates carbohydrate gram calculations (25g per serving)
- **fatGrams**: Validates fat calculations including:
  - Direct fat from fat servings (13g per serving)
  - Additional fat from protein/carbs (15% of protein + carb grams)
  - Custom additional fat percentages
- **alcoholGrams**: Validates alcohol gram calculations (15g per serving)

### Calorie Calculations (11 tests)
- **getProteinCaloriesPerServing**: Tests protein calories (4 cal/g + additional fat calories)
- **getCarbCaloriesPerServing**: Tests carb calories (4 cal/g + additional fat calories)
- **getFatCaloriesPerServing**: Tests fat calories (9 cal/g)
- **getAlcoholCaloriesPerServing**: Tests alcohol calories (7 cal/g)
- **totalCalories**: Tests total daily calorie calculations
- **targetCalories**: Tests target calorie calculations based on serving goals

### Helper Methods (5 tests)
- **calculateGramsFromServings**: Tests conversion from servings to grams for database storage
  - Ensures consistency with UI computed properties
  - Tests with various serving combinations
  - Validates additional fat inclusion

### UI Interactions (4 tests)
- **incrementMacro**: Tests incrementing macro servings
- **decrementMacro**: Tests decrementing macro servings (prevents going below zero)

### TDEE Recompute Algorithm (7 tests)
- **Data validation**: Tests require at least 2 weight entries for linear regression
- **Linear regression**: Tests weight trend calculation over 7 days
- **Calorie calculation from database**: Validates that additional fat is not double-counted when reading stored grams
- **TDEE adjustments**:
  - Tests TDEE increases when losing weight faster than target
  - Tests TDEE decreases when losing weight slower than target
  - Tests weight gain scenarios
- **Formula accuracy**: Tests the adjustment calculation using the documented algorithm
- **Overcorrection prevention**: Validates the division by 2 to allow gradual convergence
- **Variable macro compositions**: Tests with different daily macro combinations

## Test Structure

Tests are organized into describe blocks by functionality:
- `foodTracker - Grams Calculations` (15 tests)
- `foodTracker - Calorie Calculations` (11 tests)
- `foodTracker - calculateGramsFromServings` (5 tests)
- `foodTracker - Macro Increment/Decrement` (4 tests)
- `foodTracker - Calorie Expenditure Recompute` (7 tests)

**Total: 42 tests**

Each test validates a specific calculation or behavior to ensure accuracy of the macro tracking logic.

## Key Formulas Tested

### Protein/Carb Calories per Serving
```
Base calories = 25g × 4 cal/g = 100 cal
Additional fat = 25g × 15% = 3.75g × 9 cal/g = 33.75 cal
Total = 133.75 calories per serving
```

### Fat Grams (with additional fat)
```
Direct fat = servings × 13g
Additional fat = (protein grams + carb grams) × 15%
Total fat grams = direct fat + additional fat
```

### Example: 6 protein, 8 carbs, 4 fat servings
```
Protein: 150g
Carbs: 200g
Fat: 52g direct + ((150 + 200) × 0.15) = 52 + 52.5 = 104.5g
Total calories: (6 × 133.75) + (8 × 133.75) + (4 × 117) = 2341 cal
```
