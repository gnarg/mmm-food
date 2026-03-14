# AGENTS.md - Mmm Food Macro Tracker

## Project Overview

Mmm Food is a mobile-compatible Progressive Web App (PWA) for tracking daily macro servings (protein, carbohydrates, fat, alcohol). It's a static single-page application using vanilla HTML, Alpine.js for reactivity, and Tailwind CSS for styling. PocketBase provides backend storage with Google OAuth authentication.

## Development Environment

- **Nix**: Run `nix develop` to enter the dev shell with Node.js 24
- **No build process**: Runs directly in browser as static files
- **Serve locally**: `npm run serve` (runs http-server on port 3000)

## Commands

### Testing
```bash
# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a single test file
npm test -- js/app.test.js

# Run a specific test by name
npm test -- -t "calculates protein grams correctly"
```

### Development
```bash
# Start local server
npm run serve
```

## Code Style Guidelines

### File Structure
- `index.html` - Main SPA with two views (tracker and settings)
- `js/app.js` - Single Alpine.js component `foodTracker()` with all application logic
- `js/app.test.js` - Jest tests (42 tests covering calculations and TDEE algorithm)
- `css/styles.css` - Custom styles supplementing Tailwind CSS
- `manifest.json` - PWA configuration
- PocketBase collections: `mmm_macros`, `mmm_settings`, `mmm_weight`

### JavaScript/Alpine.js Conventions

**Component Structure:**
```javascript
function foodTracker() {
    return {
        // State properties (camelCase)
        protein: 0,
        targets: { protein: 6, carbs: 8, fat: 4, alcohol: 0 },
        
        // Computed properties (getters)
        get totalCalories() {
            return this.calculateCaloriesFromServings(...);
        },
        
        // Methods (camelCase, no arrow functions for `this` access)
        incrementMacro(macro) {
            this[macro]++;
            this.saveData();
        },
        
        // Async methods
        async saveSettings() {
            try {
                await this.saveSettingsToPocketBase();
            } catch (error) {
                this.settingsError = 'Unable to save...';
            }
        }
    };
}
```

**Naming Conventions:**
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` (e.g., `RECOMPUTE_INTERVAL_DAYS = 14`)
- HTML attributes: `x-data`, `x-show`, `@click` (Alpine.js syntax)
- CSS classes: `kebab-case` (e.g., `macro-button`, `offline-indicator`)

**Error Handling:**
- Use try/catch for async operations
- Set error state properties (e.g., `this.settingsError = '...'`)
- Log errors: `console.error('Context:', error)`
- Graceful degradation with localStorage fallbacks when offline

**State Management:**
- All persistent state synced to PocketBase with localStorage cache
- Loading states: `isLoading`, `isSavingSettings`, `isRecomputing`
- Error states: `settingsError`, `recomputeError`, `authError`
- Success feedback via toast messages or auto-dismiss notifications

### HTML/Tailwind CSS

**Mobile-first responsive design:**
```html
<div class="container mx-auto px-4 py-6 max-w-md">
    <!-- Touch-friendly buttons (min 48px) -->
    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg min-h-[48px]">
        Settings
    </button>
</div>
```

**Alpine.js patterns:**
- `x-data="foodTracker()"` - Initialize component
- `x-show="condition"` - Conditional display
- `@click="handler"` - Event listeners
- `x-transition` - Smooth transitions

### Key Formulas

**Calorie calculations per serving:**
- Protein: 25g + 3.75g fat = 133.75 calories
- Carbohydrates: 25g + 3.75g fat = 133.75 calories
- Fat: 13g = 117 calories
- Alcohol: 15g = 105 calories

**Additional fat:** 15% of protein + carb grams

**TDEE recomputation:**
```javascript
adjustment = (part1 - part2) / 2
part1 = (delta_lb_per_week - regression_difference) * 500
part2 = ((estimated_TDEE * 7) - actual_calories) / 7
```

## Testing Guidelines

**Test structure:**
- Tests in `js/*.test.js` files
- Use `@jest/globals` for `describe`, `test`, `expect`, `beforeEach`
- Mock PocketBase globally in test setup
- Access `foodTracker()` via `globalThis.foodTracker`

**Test organization:**
```javascript
describe('foodTracker - Grams Calculations', () => {
    let tracker;
    
    beforeEach(() => {
        tracker = foodTracker();
    });
    
    describe('proteinGrams', () => {
        test('calculates correctly with zero servings', () => {
            tracker.protein = 0;
            expect(tracker.proteinGrams).toBe(0);
        });
    });
});
```

**Coverage areas:**
- Grams calculations (protein, carbs, fat, alcohol)
- Calorie calculations
- TDEE recompute algorithm with linear regression
- UI interactions (increment/decrement)
- Edge cases (outlier filtering, minimum data points)

## Backend Integration

**PocketBase collections:**
- `mmm_macros`: `{protein, carbohydrate, fat, alcohol, user_id, created}`
- `mmm_settings`: `{user_id, key, value}` (key-value pairs)
- `mmm_weight`: `{user_id, weight_lbs, created}`

**Sync strategy:**
- Auto-save previous day on date change
- Manual "Reset Day" button for immediate save
- Offline mode uses localStorage, syncs when reconnected

## PWA Features

- Installable via "Add to Home Screen"
- Offline capability with localStorage cache
- Responsive mobile design with touch-friendly UI
- Chart.js for weight and calorie visualization

## Dependencies

- **Alpine.js** v3.x - Reactive state management
- **Tailwind CSS** v3.x - Utility-first styling
- **PocketBase SDK** v0.21.1 - Backend client
- **Chart.js** v4.4.1 - Data visualization
- **Jest** v29.7 - Testing framework