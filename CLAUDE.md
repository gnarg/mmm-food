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
- **Persistent Storage**: localStorage only (no backend)
- **Daily Data**: Stored as `mmm-food-daily` with date validation
- **Settings**: Stored as `mmm-food-targets` for daily serving goals
- **Manual Reset**: User-controlled daily reset via "Reset Day" button

### Calorie Calculation Formula
The app uses specific calorie calculations based on serving sizes:
- **Protein**: 25g + 3.75g fat = 133.75 calories per serving
- **Carbohydrates**: 25g + 3.75g fat = 133.75 calories per serving  
- **Fat**: 13g = 117 calories per serving
- **Alcohol**: 15g = 105 calories per serving

The 3.75g additional fat represents 15% of protein/carb grams as specified in the requirements.

### UI Behavior
- Large touch-friendly increment/decrement buttons for mobile use
- Consumed values display in light red when exceeding daily targets
- Settings view shows target calories breakdown and total
- View switching between main tracker and settings via Alpine.js reactivity

## Key Implementation Details

- No automatic midnight reset - manual user control only
- No backend integration despite DESIGN.md mentioning PocketBase
- PWA-ready with proper meta tags and manifest for iOS home screen installation
- Uses CDN-loaded libraries (HTMX, Alpine.js, Tailwind CSS) for simplicity
- Single Alpine.js component handles all application state and logic