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
        
        // UI state
        showSettings: false,
        
        // Calorie constants
        PROTEIN_CALORIES: 133.75,  // 25g protein + 3.75g fat
        CARB_CALORIES: 133.75,     // 25g carbs + 3.75g fat
        FAT_CALORIES: 117,         // 13g fat
        ALCOHOL_CALORIES: 105,     // 15g alcohol
        
        // Computed property for total calories
        get totalCalories() {
            return Math.round(
                this.protein * this.PROTEIN_CALORIES +
                this.carbs * this.CARB_CALORIES +
                this.fat * this.FAT_CALORIES +
                this.alcohol * this.ALCOHOL_CALORIES
            );
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
        },
        
        // Save settings
        saveSettings() {
            localStorage.setItem('mmm-food-targets', JSON.stringify(this.targets));
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