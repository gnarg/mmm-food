// Alpine.js data component for food tracker
function foodTracker() {
    return {
        // Current servings
        protein: 0,
        carbs: 0,
        fat: 0,
        alcohol: 0,
        
        // Daily targets
        targets: {
            protein: 6,
            carbs: 8,
            fat: 4,
            alcohol: 0
        },
        
        // Additional fat percentage for protein/carbs
        additionalFatPercent: 15,
        
        // UI state
        showSettings: false,
        
        // Base serving sizes
        PROTEIN_GRAMS: 25,
        CARB_GRAMS: 25,
        FAT_GRAMS: 13,
        ALCOHOL_GRAMS: 15,
        
        // Calories per gram
        PROTEIN_CAL_PER_GRAM: 4,
        CARB_CAL_PER_GRAM: 4,
        FAT_CAL_PER_GRAM: 9,
        ALCOHOL_CAL_PER_GRAM: 7,
        
        // Computed property for total calories
        get totalCalories() {
            const additionalFatFactor = this.additionalFatPercent / 100;
            const proteinCalories = this.protein * (this.PROTEIN_GRAMS * this.PROTEIN_CAL_PER_GRAM + 
                                                   this.PROTEIN_GRAMS * additionalFatFactor * this.FAT_CAL_PER_GRAM);
            const carbCalories = this.carbs * (this.CARB_GRAMS * this.CARB_CAL_PER_GRAM + 
                                              this.CARB_GRAMS * additionalFatFactor * this.FAT_CAL_PER_GRAM);
            const fatCalories = this.fat * this.FAT_GRAMS * this.FAT_CAL_PER_GRAM;
            const alcoholCalories = this.alcohol * this.ALCOHOL_GRAMS * this.ALCOHOL_CAL_PER_GRAM;
            
            return Math.round(proteinCalories + carbCalories + fatCalories + alcoholCalories);
        },

        get targetCalories() {
            return Math.round(this.targets.protein * this.getProteinCaloriesPerServing() + this.targets.carbs * this.getCarbCaloriesPerServing() + this.targets.fat * this.getFatCaloriesPerServing() + this.targets.alcohol * this.getAlcoholCaloriesPerServing());
        },
        
        // Helper methods for calorie calculations
        getProteinCaloriesPerServing() {
            const additionalFatFactor = this.additionalFatPercent / 100;
            return this.PROTEIN_GRAMS * this.PROTEIN_CAL_PER_GRAM + 
                   this.PROTEIN_GRAMS * additionalFatFactor * this.FAT_CAL_PER_GRAM;
        },
        
        getCarbCaloriesPerServing() {
            const additionalFatFactor = this.additionalFatPercent / 100;
            return this.CARB_GRAMS * this.CARB_CAL_PER_GRAM + 
                   this.CARB_GRAMS * additionalFatFactor * this.FAT_CAL_PER_GRAM;
        },
        
        getFatCaloriesPerServing() {
            return this.FAT_GRAMS * this.FAT_CAL_PER_GRAM;
        },
        
        getAlcoholCaloriesPerServing() {
            return this.ALCOHOL_GRAMS * this.ALCOHOL_CAL_PER_GRAM;
        },
        
        // Initialize component
        init() {
            this.loadData();
        },
        
        // Increment macro serving
        incrementMacro(macro) {
            this[macro]++;
            this.saveData();
        },
        
        // Decrement macro serving
        decrementMacro(macro) {
            if (this[macro] > 0) {
                this[macro]--;
                this.saveData();
            }
        },
        
        // Save current data to localStorage
        saveData() {
            const data = {
                protein: this.protein,
                carbs: this.carbs,
                fat: this.fat,
                alcohol: this.alcohol,
                date: new Date().toDateString()
            };
            
            localStorage.setItem('mmm-food-daily', JSON.stringify(data));
        },
        
        // Load data from localStorage
        loadData() {
            const today = new Date().toDateString();
            
            // Load daily data
            const localData = localStorage.getItem('mmm-food-daily');
            if (localData) {
                const data = JSON.parse(localData);
                if (data.date === today) {
                    this.protein = data.protein || 0;
                    this.carbs = data.carbs || 0;
                    this.fat = data.fat || 0;
                    this.alcohol = data.alcohol || 0;
                }
            }
            
            // Load targets
            const targetsData = localStorage.getItem('mmm-food-targets');
            if (targetsData) {
                this.targets = JSON.parse(targetsData);
            }
            
            // Load additional fat percentage
            const fatPercentData = localStorage.getItem('mmm-food-fat-percent');
            if (fatPercentData) {
                this.additionalFatPercent = parseFloat(fatPercentData);
            }
        },
        
        // Save settings
        saveSettings() {
            localStorage.setItem('mmm-food-targets', JSON.stringify(this.targets));
            localStorage.setItem('mmm-food-fat-percent', this.additionalFatPercent.toString());
            this.showSettings = false;
        },
        
        // Manual reset of daily servings
        resetDaily() {
            this.protein = 0;
            this.carbs = 0;
            this.fat = 0;
            this.alcohol = 0;
            this.saveData();
        }
    };
}