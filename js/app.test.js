import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock PocketBase
global.PocketBase = class PocketBase {
    constructor() {
        this.authStore = { isValid: false, model: null };
    }
};

// Import the foodTracker function
const { foodTracker } = await import('./app.js');

describe('foodTracker - Grams Calculations', () => {
    let tracker;

    beforeEach(() => {
        tracker = foodTracker();
    });

    describe('proteinGrams', () => {
        test('calculates protein grams correctly with zero servings', () => {
            tracker.protein = 0;
            expect(tracker.proteinGrams).toBe(0);
        });

        test('calculates protein grams correctly with single serving', () => {
            tracker.protein = 1;
            expect(tracker.proteinGrams).toBe(25); // 1 * 25
        });

        test('calculates protein grams correctly with multiple servings', () => {
            tracker.protein = 6;
            expect(tracker.proteinGrams).toBe(150); // 6 * 25
        });
    });

    describe('carbGrams', () => {
        test('calculates carb grams correctly with zero servings', () => {
            tracker.carbs = 0;
            expect(tracker.carbGrams).toBe(0);
        });

        test('calculates carb grams correctly with single serving', () => {
            tracker.carbs = 1;
            expect(tracker.carbGrams).toBe(25); // 1 * 25
        });

        test('calculates carb grams correctly with multiple servings', () => {
            tracker.carbs = 8;
            expect(tracker.carbGrams).toBe(200); // 8 * 25
        });
    });

    describe('fatGrams', () => {
        test('calculates fat grams with no servings', () => {
            tracker.protein = 0;
            tracker.carbs = 0;
            tracker.fat = 0;
            expect(tracker.fatGrams).toBe(0);
        });

        test('calculates fat grams with only direct fat', () => {
            tracker.protein = 0;
            tracker.carbs = 0;
            tracker.fat = 1;
            expect(tracker.fatGrams).toBe(13); // 1 * 13
        });

        test('calculates fat grams with additional fat from protein', () => {
            tracker.protein = 1; // 25g protein
            tracker.carbs = 0;
            tracker.fat = 0;
            // Additional fat = 25 * 0.15 = 3.75g
            expect(tracker.fatGrams).toBe(4); // Rounded from 3.75
        });

        test('calculates fat grams with additional fat from carbs', () => {
            tracker.protein = 0;
            tracker.carbs = 1; // 25g carbs
            tracker.fat = 0;
            // Additional fat = 25 * 0.15 = 3.75g
            expect(tracker.fatGrams).toBe(4); // Rounded from 3.75
        });

        test('calculates fat grams with direct fat and additional fat', () => {
            tracker.protein = 6; // 150g protein
            tracker.carbs = 8;   // 200g carbs
            tracker.fat = 4;     // 52g direct fat
            // Additional fat = (150 + 200) * 0.15 = 52.5g
            // Total fat = 52 + 52.5 = 104.5g
            expect(tracker.fatGrams).toBe(105); // Rounded from 104.5
        });

        test('uses custom additional fat percentage', () => {
            tracker.additionalFatPercent = 20; // Change from default 15%
            tracker.protein = 1; // 25g protein
            tracker.carbs = 1;   // 25g carbs
            tracker.fat = 0;
            // Additional fat = (25 + 25) * 0.20 = 10g
            expect(tracker.fatGrams).toBe(10);
        });
    });

    describe('alcoholGrams', () => {
        test('calculates alcohol grams correctly with zero servings', () => {
            tracker.alcohol = 0;
            expect(tracker.alcoholGrams).toBe(0);
        });

        test('calculates alcohol grams correctly with single serving', () => {
            tracker.alcohol = 1;
            expect(tracker.alcoholGrams).toBe(15); // 1 * 15
        });

        test('calculates alcohol grams correctly with multiple servings', () => {
            tracker.alcohol = 3;
            expect(tracker.alcoholGrams).toBe(45); // 3 * 15
        });
    });
});

describe('foodTracker - Calorie Calculations', () => {
    let tracker;

    beforeEach(() => {
        tracker = foodTracker();
    });

    describe('getProteinCaloriesPerServing', () => {
        test('calculates protein calories per serving with default fat percentage', () => {
            // Protein: 25g * 4 cal/g = 100 cal
            // Additional fat: 25g * 0.15 = 3.75g * 9 cal/g = 33.75 cal
            // Total: 133.75 cal
            expect(tracker.getProteinCaloriesPerServing()).toBe(133.75);
        });

        test('calculates protein calories per serving with custom fat percentage', () => {
            tracker.additionalFatPercent = 20;
            // Protein: 25g * 4 cal/g = 100 cal
            // Additional fat: 25g * 0.20 = 5g * 9 cal/g = 45 cal
            // Total: 145 cal
            expect(tracker.getProteinCaloriesPerServing()).toBe(145);
        });
    });

    describe('getCarbCaloriesPerServing', () => {
        test('calculates carb calories per serving with default fat percentage', () => {
            // Carbs: 25g * 4 cal/g = 100 cal
            // Additional fat: 25g * 0.15 = 3.75g * 9 cal/g = 33.75 cal
            // Total: 133.75 cal
            expect(tracker.getCarbCaloriesPerServing()).toBe(133.75);
        });
    });

    describe('getFatCaloriesPerServing', () => {
        test('calculates fat calories per serving', () => {
            // Fat: 13g * 9 cal/g = 117 cal
            expect(tracker.getFatCaloriesPerServing()).toBe(117);
        });
    });

    describe('getAlcoholCaloriesPerServing', () => {
        test('calculates alcohol calories per serving', () => {
            // Alcohol: 15g * 7 cal/g = 105 cal
            expect(tracker.getAlcoholCaloriesPerServing()).toBe(105);
        });
    });

    describe('totalCalories', () => {
        test('calculates zero calories with no servings', () => {
            tracker.protein = 0;
            tracker.carbs = 0;
            tracker.fat = 0;
            tracker.alcohol = 0;
            expect(tracker.totalCalories).toBe(0);
        });

        test('calculates calories for protein only', () => {
            tracker.protein = 1;
            tracker.carbs = 0;
            tracker.fat = 0;
            tracker.alcohol = 0;
            // 1 * 133.75 = 133.75, rounded = 134
            expect(tracker.totalCalories).toBe(134);
        });

        test('calculates calories for complete meal', () => {
            tracker.protein = 6;  // 6 * 133.75 = 802.5
            tracker.carbs = 8;    // 8 * 133.75 = 1070
            tracker.fat = 4;      // 4 * 117 = 468
            tracker.alcohol = 0;
            // Total: 802.5 + 1070 + 468 = 2340.5, rounded = 2341
            expect(tracker.totalCalories).toBe(2341);
        });

        test('includes alcohol in total calories', () => {
            tracker.protein = 0;
            tracker.carbs = 0;
            tracker.fat = 0;
            tracker.alcohol = 2; // 2 * 105 = 210
            expect(tracker.totalCalories).toBe(210);
        });
    });

    describe('targetCalories', () => {
        test('calculates target calories with default targets', () => {
            // Default: protein=6, carbs=8, fat=4, alcohol=0
            // (6 * 133.75) + (8 * 133.75) + (4 * 117) + (0 * 105)
            // = 802.5 + 1070 + 468 + 0 = 2340.5, rounded = 2341
            expect(tracker.targetCalories).toBe(2341);
        });

        test('calculates target calories with custom targets', () => {
            tracker.targets.protein = 4;
            tracker.targets.carbs = 6;
            tracker.targets.fat = 2;
            tracker.targets.alcohol = 1;
            // (4 * 133.75) + (6 * 133.75) + (2 * 117) + (1 * 105)
            // = 535 + 802.5 + 234 + 105 = 1676.5, rounded = 1677
            expect(tracker.targetCalories).toBe(1677);
        });
    });
});

describe('foodTracker - calculateGramsFromServings', () => {
    let tracker;

    beforeEach(() => {
        tracker = foodTracker();
    });

    test('calculates grams for zero servings', () => {
        const result = tracker.calculateGramsFromServings(0, 0, 0, 0);
        expect(result).toEqual({
            protein: 0,
            carbohydrate: 0,
            fat: 0,
            alcohol: 0
        });
    });

    test('calculates grams for single servings', () => {
        const result = tracker.calculateGramsFromServings(1, 1, 1, 1);
        // Protein: 25g
        // Carbs: 25g
        // Fat: 13g direct + (25 + 25) * 0.15 = 13 + 7.5 = 20.5g
        // Alcohol: 15g
        expect(result).toEqual({
            protein: 25,
            carbohydrate: 25,
            fat: 20.5,
            alcohol: 15
        });
    });

    test('calculates grams matching UI computed properties', () => {
        // Set tracker state
        tracker.protein = 6;
        tracker.carbs = 8;
        tracker.fat = 4;
        tracker.alcohol = 0;

        // Get computed grams
        const computedProtein = tracker.proteinGrams;
        const computedCarbs = tracker.carbGrams;
        const computedFat = tracker.fatGrams;
        const computedAlcohol = tracker.alcoholGrams;

        // Calculate using helper method
        const result = tracker.calculateGramsFromServings(6, 8, 4, 0);

        // Should match (within rounding)
        expect(result.protein).toBe(computedProtein);
        expect(result.carbohydrate).toBe(computedCarbs);
        expect(Math.round(result.fat)).toBe(computedFat);
        expect(result.alcohol).toBe(computedAlcohol);
    });

    test('uses custom additional fat percentage', () => {
        tracker.additionalFatPercent = 20;
        const result = tracker.calculateGramsFromServings(2, 2, 1, 0);
        // Protein: 50g
        // Carbs: 50g
        // Fat: 13g direct + (50 + 50) * 0.20 = 13 + 20 = 33g
        // Alcohol: 0g
        expect(result).toEqual({
            protein: 50,
            carbohydrate: 50,
            fat: 33,
            alcohol: 0
        });
    });

    test('calculates typical daily intake', () => {
        const result = tracker.calculateGramsFromServings(6, 8, 4, 0);
        // Protein: 150g
        // Carbs: 200g
        // Fat: 52g direct + (150 + 200) * 0.15 = 52 + 52.5 = 104.5g
        // Alcohol: 0g
        expect(result).toEqual({
            protein: 150,
            carbohydrate: 200,
            fat: 104.5,
            alcohol: 0
        });
    });
});

describe('foodTracker - Macro Increment/Decrement', () => {
    let tracker;

    beforeEach(() => {
        tracker = foodTracker();
        // Mock saveData to avoid localStorage in tests
        tracker.saveData = () => {};
    });

    test('incrementMacro increases protein', () => {
        tracker.protein = 5;
        tracker.incrementMacro('protein');
        expect(tracker.protein).toBe(6);
    });

    test('decrementMacro decreases protein when greater than zero', () => {
        tracker.protein = 5;
        tracker.decrementMacro('protein');
        expect(tracker.protein).toBe(4);
    });

    test('decrementMacro does not go below zero', () => {
        tracker.protein = 0;
        tracker.decrementMacro('protein');
        expect(tracker.protein).toBe(0);
    });

    test('incrementMacro works for all macro types', () => {
        tracker.incrementMacro('protein');
        tracker.incrementMacro('carbs');
        tracker.incrementMacro('fat');
        tracker.incrementMacro('alcohol');

        expect(tracker.protein).toBe(1);
        expect(tracker.carbs).toBe(1);
        expect(tracker.fat).toBe(1);
        expect(tracker.alcohol).toBe(1);
    });
});

describe('foodTracker - Calorie Expenditure Recompute', () => {
    let tracker;
    let mockPb;

    beforeEach(() => {
        tracker = foodTracker();
        tracker.user = { id: 'test-user-123' };
        tracker.calorieExpenditure = 2500;
        tracker.deltaLbPerWeek = -1; // Targeting 1 lb/week loss
        tracker.additionalFatPercent = 15;

        // Mock PocketBase instance
        mockPb = {
            collection: (name) => ({
                getFullList: async (options) => {
                    if (name === 'mmm_weight') {
                        return mockPb.weightData || [];
                    }
                    if (name === 'mmm_macros') {
                        return mockPb.macroData || [];
                    }
                    return [];
                }
            })
        };

        // Replace global pb with mock
        global.pb = mockPb;
    });

    test('requires at least 2 weight entries', async () => {
        mockPb.weightData = [
            { created: '2026-01-15T12:00:00Z', weight_lbs: 180 }
        ];
        mockPb.macroData = [];

        await tracker.recomputeCalorieExpenditure();

        expect(tracker.recomputeError).toContain('Need at least 2 weight entries');
        expect(tracker.calorieExpenditure).toBe(2500); // Unchanged
    });

    test('calculates linear regression correctly for weight loss', async () => {
        // Simulating steady 1 lb loss over 7 days
        const now = new Date('2026-01-16T12:00:00Z');
        mockPb.weightData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 180.0 },
            { created: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 179.8 },
            { created: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 179.6 },
            { created: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 179.4 },
            { created: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 179.2 },
            { created: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 179.0 },
            { created: now.toISOString(), weight_lbs: 178.8 }
        ];

        // 2000 calories
        mockPb.macroData = Array(7).fill(null).map((_, i) => ({
            created: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            protein: 150,      // 150g protein
            carbohydrate: 200, // 200g carbs
            fat: 104.5,        // 52g direct + 52.5g additional = 104.5g total
            alcohol: 0
        }));

        await tracker.recomputeCalorieExpenditure();

        // Weight regression should show ~1.2 lb loss
        // Ate 2000 cal/day, lost target amount
        // TDEE should stay relatively stable or adjust slightly
        expect(tracker.recomputeError).toBeNull();
        expect(tracker.calorieExpenditure).toEqual(2470);
    });

    test('adjusts TDEE upward when losing weight faster than target', async () => {
        const now = new Date('2026-01-16T12:00:00Z');

        // Lost 2 lbs in a week (faster than -1 lb/week target)
        mockPb.weightData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 180 },
            { created: now.toISOString(), weight_lbs: 178 }
        ];

        // Ate 2000 cal/day
        const dailyCalories = 2000;
        mockPb.macroData = Array(7).fill(null).map((_, i) => ({
            created: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            protein: 150,
            carbohydrate: 200,
            fat: 104.5,
            alcohol: 0
        }));

        tracker.calorieExpenditure = 2500;
        tracker.deltaLbPerWeek = -1; // Targeting 1 lb/week loss

        await tracker.recomputeCalorieExpenditure();

        // Lost faster than target, so TDEE should increase
        // (eating same calories but losing more = higher metabolism)
        expect(tracker.calorieExpenditure).toEqual(2670);
    });

    test('adjusts TDEE downward when losing weight slower than target', async () => {
        const now = new Date('2026-01-16T12:00:00Z');

        // Lost only 0.5 lbs in a week (slower than -1 lb/week target)
        mockPb.weightData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 180 },
            { created: now.toISOString(), weight_lbs: 179.5 }
        ];

        // Ate 2000 cal/day (expecting to lose 1 lb/week with TDEE of 2500)
        mockPb.macroData = Array(7).fill(null).map((_, i) => ({
            created: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            protein: 150,
            carbohydrate: 200,
            fat: 104.5,
            alcohol: 0
        }));

        tracker.calorieExpenditure = 2500;
        tracker.deltaLbPerWeek = -1;

        const initialTDEE = tracker.calorieExpenditure;
        await tracker.recomputeCalorieExpenditure();

        // Lost slower than target, so TDEE should decrease
        // (eating same calories but losing less = lower metabolism than estimated)
        expect(tracker.calorieExpenditure).toEqual(2295);
    });

    test('handles weight gain target correctly', async () => {
        const now = new Date('2026-01-16T12:00:00Z');

        // Gained 0.5 lbs in a week (target was +0.5 lb/week)
        mockPb.weightData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 180 },
            { created: now.toISOString(), weight_lbs: 180.5 }
        ];

        // Ate 2750 cal/day (TDEE 2500 + 250 surplus for 0.5 lb/week gain)
        mockPb.macroData = Array(7).fill(null).map((_, i) => ({
            created: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            protein: 200,
            carbohydrate: 250,
            fat: 117.5, // Includes additional fat
            alcohol: 0
        }));

        tracker.calorieExpenditure = 2500;
        tracker.deltaLbPerWeek = 0.5; // Targeting 0.5 lb/week gain

        await tracker.recomputeCalorieExpenditure();

        // Should adjust based on actual vs target gain
        expect(tracker.recomputeError).toBeNull();
        expect(tracker.calorieExpenditure).toEqual(2679);
    });

    test('calculates adjustment formula correctly', async () => {
        const now = new Date('2026-01-16T12:00:00Z');

        // Set up specific scenario to test formula
        // Target: -1 lb/week, Actual: -0.5 lb/week
        mockPb.weightData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 180 },
            { created: now.toISOString(), weight_lbs: 179.5 }
        ];

        // Ate 2000 cal/day for 7 days = 14000 total
        mockPb.macroData = Array(7).fill(null).map((_, i) => ({
            created: new Date(now - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            protein: 150,      // 600 cal
            carbohydrate: 200, // 800 cal
            fat: 104.5,        // 940.5 cal
            alcohol: 0         // 0 cal
            // Total: ~2341 cal/day
        }));

        tracker.calorieExpenditure = 2500;
        tracker.deltaLbPerWeek = -1;

        const initialTDEE = tracker.calorieExpenditure;
        await tracker.recomputeCalorieExpenditure();

        // TDEE should decrease (actual result will depend on exact regression)
        expect(tracker.recomputeError).toBeNull();
        expect(tracker.calorieExpenditure).toEqual(2295);
    });

    test('handles varying macro compositions correctly', async () => {
        const now = new Date('2026-01-16T12:00:00Z');

        mockPb.weightData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), weight_lbs: 180 },
            { created: now.toISOString(), weight_lbs: 179 }
        ];

        // Different macro compositions across days
        mockPb.macroData = [
            { created: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), protein: 200, carbohydrate: 150, fat: 96.5, alcohol: 0 },
            { created: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), protein: 150, carbohydrate: 250, fat: 112, alcohol: 0 },
            { created: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), protein: 175, carbohydrate: 200, fat: 108.75, alcohol: 15 },
            { created: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), protein: 160, carbohydrate: 180, fat: 103, alcohol: 0 },
            { created: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), protein: 140, carbohydrate: 220, fat: 106, alcohol: 30 },
            { created: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), protein: 180, carbohydrate: 190, fat: 107.5, alcohol: 0 },
            { created: now.toISOString(), protein: 155, carbohydrate: 210, fat: 106.75, alcohol: 15 }
        ];

        await tracker.recomputeCalorieExpenditure();

        // Should handle varying macros and calculate total correctly
        expect(tracker.recomputeError).toBeNull();
        expect(tracker.calorieExpenditure).toEqual(2487);
    });
});
