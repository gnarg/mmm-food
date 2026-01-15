# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mmm Food is a mobile-compatible Progressive Web App (PWA) for tracking daily macro servings: protein, carbohydrates, fat, and alcohol. It's a static single-page application built with vanilla HTML, Alpine.js for reactivity, and Tailwind CSS for styling.

## Development Environment

This project uses Nix for development environment management:
- Run `nix develop` to enter the development shell with Node.js 24 and Claude Code available
- No build process required - runs directly in browser as static files

## Architecture

### Core Files Structure
- `index.html` - Main SPA with two views (tracker and settings)
- `js/app.js` - Single Alpine.js component `foodTracker()` with all application logic
- `css/styles.css` - Custom styles supplementing Tailwind CSS
- `manifest.json` - PWA configuration for "Add to Home Screen" functionality
- `icons/food-svgrepo-com.svg` - Single SVG icon used for all PWA icons

### State Management
- **Persistent Storage**: PocketBase backend with localStorage cache
- **Daily Data**: Client-side tracking, synced to PocketBase on "Reset Day" or date change
- **Settings**: Backed by `mmm_settings` table in PocketBase
- **Weight Tracking**: Stored in `mmm_weight` table
- **Authentication**: Google OAuth via PocketBase

### Calorie Calculation Formula
The app uses specific calorie calculations based on serving sizes:
- **Protein**: 25g + 3.75g fat = 133.75 calories per serving
- **Carbohydrates**: 25g + 3.75g fat = 133.75 calories per serving  
- **Fat**: 13g = 117 calories per serving
- **Alcohol**: 15g = 105 calories per serving

The 3.75g additional fat represents 15% of protein/carb grams as specified in the requirements.

## TDEE Estimation and Calorie Target Algorithm

### Overview

The app uses an adaptive TDEE (Total Daily Energy Expenditure) estimation system that adjusts based on actual weight trends and calorie intake. This allows users to dial in their personalized calorie needs over time.

### Key Settings

1. **Calorie Expenditure** (`calorieExpenditure`): Estimated TDEE in calories/day
   - Stored in PocketBase as `calorie_expenditure`
   - Represents the total calories your body burns per day
   - Defaults to 0; user should set initial estimate

2. **Delta lb/week** (`deltaLbPerWeek`): Target weight change per week
   - Stored in PocketBase as `delta_lb_per_week`
   - Negative values = weight loss (e.g., -1 = lose 1 lb/week)
   - Positive values = weight gain (e.g., 0.5 = gain 0.5 lb/week)
   - Zero = maintain weight

### Suggested Daily Calorie Intake

The app calculates suggested daily calorie intake using the formula:

```
Suggested Calories = TDEE + (delta_lb_per_week × 500)
```

**Examples:**
- TDEE: 2500 cal, Target: -1 lb/week → Suggested: 2500 + (-1 × 500) = **2000 cal/day**
- TDEE: 2500 cal, Target: -2 lb/week → Suggested: 2500 + (-2 × 500) = **1500 cal/day**
- TDEE: 2500 cal, Target: +0.5 lb/week → Suggested: 2500 + (0.5 × 500) = **2750 cal/day**
- TDEE: 2500 cal, Target: 0 lb/week → Suggested: 2500 + (0 × 500) = **2500 cal/day**

This is based on the standard 3500 calories = 1 pound conversion (500 cal/day × 7 days = 3500 cal/week = 1 lb).

### TDEE Recompute Algorithm

The "Recompute" button in settings adjusts TDEE based on the past week's actual results. It uses both weight trends and calorie intake to provide a more accurate estimate.

#### Data Requirements
- At least 2 weight entries from the past 7 days (`mmm_weight` table)
- Macro records from the past 7 days (`mmm_macros` table)

#### Algorithm Steps

1. **Fetch weight data** from past 7 days
2. **Perform linear regression** on weight vs time:
   - Convert timestamps to days since epoch
   - Calculate slope and intercept using least squares method
   - Predict weight at start and end of period
   - Calculate: `regression_difference = y_end - y_start`
     - Negative value = weight loss
     - Positive value = weight gain

3. **Fetch and calculate actual calories consumed**:
   - Get macro records from past 7 days
   - Calculate total calories using the same formulas as the tracker
   - Sum all days: `sum_of_week_calories`

4. **Calculate adjustment**:
   ```
   part1 = (delta_lb_per_week - regression_difference) × 500
   part2 = ((calorie_expenditure × 7) - sum_of_week_calories) / 7
   adjustment = (part1 - part2) / 2
   ```

   The division by 2 reduces over-adjustment, allowing the TDEE to converge gradually over multiple weeks.

5. **Update TDEE**:
   ```
   calorie_expenditure += Math.round(adjustment)
   ```

#### Algorithm Explanation

**Part 1: Weight-based adjustment**
- Compares target weight change vs actual weight change
- `(target - actual) × 500 calories/lb`
- If losing slower than target → decrease TDEE estimate
- If losing faster than target → increase TDEE estimate

**Part 2: Calorie intake correction**
- Compares estimated TDEE vs actual calories eaten
- `((estimated_TDEE × 7) - actual_calories) / 7`
- Accounts for discrepancy between prediction and reality
- If ate less than estimated TDEE but didn't lose expected weight → TDEE is lower than estimated

**Division by 2:**
- Prevents overcorrection from noisy data
- Allows TDEE to stabilize over 2-3 weeks
- Acceptable to take multiple iterations to converge

#### Example Calculation

**Scenario:**
- Current TDEE estimate: 2500 cal/day
- Target: Lose 1 lb/week (`delta_lb_per_week = -1`)
- Actual weight change: Lost 0.5 lb (`regression_difference = -0.5`)
- Actually ate: 2000 cal/day average (14,000 total for week)

**Calculation:**
```
part1 = (-1 - (-0.5)) × 500 = -0.5 × 500 = -250
part2 = ((2500 × 7) - 14000) / 7 = (17500 - 14000) / 7 = 500
adjustment = (-250 - 500) / 2 = -750 / 2 = -375
new TDEE = 2500 + (-375) = 2125 cal/day
```

**Interpretation:**
- User ate 500 cal/day less than estimated TDEE
- But only lost half the target weight
- This indicates actual TDEE is lower than estimated
- Algorithm reduces TDEE by 375 cal to account for both factors
- Next week, user should aim for ~1625 cal/day to lose 1 lb/week

### UI Behavior
- Large touch-friendly increment/decrement buttons for mobile use
- Consumed values display in light red when exceeding daily targets
- Settings view shows target calories breakdown and total
- View switching between main tracker and settings via Alpine.js reactivity

## Key Implementation Details

### Backend Integration (PocketBase)
- **Authentication**: Google OAuth via PocketBase at `db.guymon.family`
- **Collections**:
  - `mmm_macros`: Daily macro records (protein, carbohydrate, fat, alcohol, user_id)
  - `mmm_settings`: User settings as key-value pairs (protein_servings, calorie_expenditure, etc.)
  - `mmm_weight`: Weight log entries (weight_lbs, user_id, timestamp)
- **Sync Strategy**:
  - Client-side tracking with localStorage cache
  - Syncs to PocketBase on "Reset Day" or automatic date change
  - Settings sync on load and save
  - Offline fallback to localStorage

### Daily Reset Behavior
- **Automatic date change**: When opening app on new day, saves previous day's data to PocketBase then resets
- **Manual "Reset Day"**: Saves current data to PocketBase then resets (fails gracefully if offline)
- **Weight logging**: "Log Weight" button creates entries in `mmm_weight` table

### Technical Stack
- PWA-ready with proper meta tags and manifest for iOS home screen installation
- Uses CDN-loaded libraries (HTMX, Alpine.js, Tailwind CSS, PocketBase SDK) for simplicity
- Single Alpine.js component handles all application state and logic
- No build process required - runs directly in browser as static files