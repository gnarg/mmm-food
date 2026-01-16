// Initialize PocketBase client
const pb = new PocketBase('https://db.guymon.family');

// Alpine.js data component for food tracker
function foodTracker() {
    return {
        // Auth state
        user: null,
        isAuthenticated: false,
        authError: null,
        isLoading: true,
        resetError: null,
        isResetting: false,
        autoSaveMessage: null,
        dateChangeWarning: null,

        // Settings sync state
        settingsError: null,
        isLoadingSettings: false,
        isSavingSettings: false,
        usingCachedSettings: false,
        isRecomputing: false,
        recomputeError: null,

        // Weight tracking state
        showWeightDialog: false,
        weightInput: '',
        weightError: null,
        isSavingWeight: false,

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

        // Additional settings
        calorieExpenditure: 0,
        deltaLbPerWeek: 0,

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
            return this.calculateCaloriesFromServings(this.protein, this.carbs, this.fat, this.alcohol);
        },

        get targetCalories() {
            return this.calculateCaloriesFromServings(this.targets.protein, this.targets.carbs, this.targets.fat, this.targets.alcohol);
        },

        // Computed properties for grams consumed
        get proteinGrams() {
            return Math.round(this.protein * this.PROTEIN_GRAMS);
        },

        get carbGrams() {
            return Math.round(this.carbs * this.CARB_GRAMS);
        },

        get fatGrams() {
            const directFat = this.fat * this.FAT_GRAMS;
            const additionalFat = (this.protein * this.PROTEIN_GRAMS + this.carbs * this.CARB_GRAMS) * this.additionalFatFactor;
            return Math.round(directFat + additionalFat);
        },

        get alcoholGrams() {
            return Math.round(this.alcohol * this.ALCOHOL_GRAMS);
        },

        // Helper getter for additional fat factor (used in multiple calculations)
        get additionalFatFactor() {
            return this.additionalFatPercent / 100;
        },

        // Helper methods for calorie calculations
        getProteinCaloriesPerServing() {
            return this.PROTEIN_GRAMS * this.PROTEIN_CAL_PER_GRAM +
                   this.PROTEIN_GRAMS * this.additionalFatFactor * this.FAT_CAL_PER_GRAM;
        },

        getCarbCaloriesPerServing() {
            return this.CARB_GRAMS * this.CARB_CAL_PER_GRAM +
                   this.CARB_GRAMS * this.additionalFatFactor * this.FAT_CAL_PER_GRAM;
        },
        
        getFatCaloriesPerServing() {
            return this.FAT_GRAMS * this.FAT_CAL_PER_GRAM;
        },
        
        getAlcoholCaloriesPerServing() {
            return this.ALCOHOL_GRAMS * this.ALCOHOL_CAL_PER_GRAM;
        },

        // Helper method to calculate calories from serving values
        calculateCaloriesFromServings(proteinServings, carbServings, fatServings, alcoholServings) {
            return Math.round(
                proteinServings * this.getProteinCaloriesPerServing() +
                carbServings * this.getCarbCaloriesPerServing() +
                fatServings * this.getFatCaloriesPerServing() +
                alcoholServings * this.getAlcoholCaloriesPerServing()
            );
        },

        // Helper method to calculate grams from serving values (same logic as computed properties)
        calculateGramsFromServings(proteinServings, carbServings, fatServings, alcoholServings) {
            const proteinGrams = proteinServings * this.PROTEIN_GRAMS;
            const carbGrams = carbServings * this.CARB_GRAMS;
            const directFat = fatServings * this.FAT_GRAMS;
            const additionalFat = (proteinGrams + carbGrams) * this.additionalFatFactor;
            const totalFatGrams = directFat + additionalFat;
            const alcoholGrams = alcoholServings * this.ALCOHOL_GRAMS;

            return {
                protein: proteinGrams,
                carbohydrate: carbGrams,
                fat: totalFatGrams,
                alcohol: alcoholGrams
            };
        },

        // Helper method to calculate calories from raw grams (for database records)
        calculateCaloriesFromGrams(proteinGrams, carbGrams, fatGrams, alcoholGrams) {
            return proteinGrams * this.PROTEIN_CAL_PER_GRAM +
                   carbGrams * this.CARB_CAL_PER_GRAM +
                   fatGrams * this.FAT_CAL_PER_GRAM +
                   alcoholGrams * this.ALCOHOL_CAL_PER_GRAM;
        },

        // Helper method to reset all macro servings to 0
        resetMacros() {
            this.protein = 0;
            this.carbs = 0;
            this.fat = 0;
            this.alcohol = 0;
            this.saveData();
        },

        // Helper method to create macro data object for PocketBase
        createMacroDataObject(proteinServings, carbServings, fatServings, alcoholServings) {
            const grams = this.calculateGramsFromServings(proteinServings, carbServings, fatServings, alcoholServings);
            return {
                ...grams,
                user_id: this.user.id
            };
        },

        // Helper method to cache settings to localStorage
        cacheSettingsToLocalStorage() {
            localStorage.setItem('mmm-food-targets', JSON.stringify(this.targets));
            localStorage.setItem('mmm-food-fat-percent', this.additionalFatPercent.toString());
            localStorage.setItem('mmm-food-calorie-expenditure', this.calorieExpenditure.toString());
            localStorage.setItem('mmm-food-delta-lb-per-week', this.deltaLbPerWeek.toString());
        },

        // Initialize component
        async init() {
            // Check if we're handling an OAuth callback
            const params = new URLSearchParams(window.location.search);
            if (params.has('code')) {
                await this.handleOAuthCallback();
                return;
            }

            // Check authentication status
            await this.checkAuth();

            // Load data if authenticated
            if (this.isAuthenticated) {
                await this.loadData();
                // Load settings from PocketBase (with localStorage fallback)
                await this.loadSettingsFromPocketBase();
            }

            this.isLoading = false;
        },

        // Check if user is authenticated
        async checkAuth() {
            try {
                // Try to refresh auth token
                if (pb.authStore.isValid) {
                    await pb.collection('users').authRefresh();
                    this.isAuthenticated = true;
                    this.user = pb.authStore.model;
                } else {
                    // Not authenticated, initiate OAuth
                    await this.initiateOAuth();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                // Try to initiate OAuth
                await this.initiateOAuth();
            }
        },

        // Initiate OAuth flow
        async initiateOAuth() {
            try {
                const authMethods = await pb.collection('users').listAuthMethods();
                const googleProvider = authMethods.authProviders.find(p => p.name === 'google');

                if (!googleProvider) {
                    this.authError = 'Google OAuth is not configured';
                    this.isLoading = false;
                    return;
                }

                // Store provider info in localStorage for callback
                localStorage.setItem('oauth-provider', JSON.stringify({
                    name: googleProvider.name,
                    state: googleProvider.state,
                    codeVerifier: googleProvider.codeVerifier
                }));

                // Redirect to Google OAuth
                const redirectUrl = window.location.origin + window.location.pathname;
                window.location.href = googleProvider.authUrl + redirectUrl;
            } catch (error) {
                console.error('OAuth initiation failed:', error);
                this.authError = 'Failed to initiate authentication: ' + error.message;
                this.isLoading = false;
            }
        },

        // Handle OAuth callback
        async handleOAuthCallback() {
            try {
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const state = params.get('state');

                // Retrieve provider info from localStorage
                const providerData = localStorage.getItem('oauth-provider');
                if (!providerData) {
                    throw new Error('No OAuth provider data found');
                }

                const provider = JSON.parse(providerData);

                // Verify state parameter (CSRF protection)
                if (provider.state !== state) {
                    throw new Error('State parameters do not match');
                }

                // Exchange code for token
                const redirectUrl = window.location.origin + window.location.pathname;
                await pb.collection('users').authWithOAuth2Code(
                    provider.name,
                    code,
                    provider.codeVerifier,
                    redirectUrl
                );

                // Clean up
                localStorage.removeItem('oauth-provider');

                // Update auth state
                this.isAuthenticated = true;
                this.user = pb.authStore.model;

                // Clean URL and reload
                window.history.replaceState({}, document.title, window.location.pathname);
                this.loadData();
                this.isLoading = false;
            } catch (error) {
                console.error('OAuth callback failed:', error);
                this.authError = 'Authentication failed: ' + error.message;
                this.isLoading = false;
                // Clear OAuth provider data
                localStorage.removeItem('oauth-provider');
            }
        },

        // Logout user
        logout() {
            pb.authStore.clear();
            this.isAuthenticated = false;
            this.user = null;
            window.location.reload();
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
        async loadData() {
            const today = new Date().toDateString();

            // Load daily data
            const localData = localStorage.getItem('mmm-food-daily');
            if (localData) {
                const data = JSON.parse(localData);

                // Check if date has changed
                if (data.date !== today) {
                    // Date changed - need to handle old data
                    await this.handleDateChange(data);
                } else {
                    // Same day - load normally
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

            // Load additional settings
            const calorieExpenditureData = localStorage.getItem('mmm-food-calorie-expenditure');
            if (calorieExpenditureData) {
                this.calorieExpenditure = parseFloat(calorieExpenditureData);
            }

            const deltaLbPerWeekData = localStorage.getItem('mmm-food-delta-lb-per-week');
            if (deltaLbPerWeekData) {
                this.deltaLbPerWeek = parseFloat(deltaLbPerWeekData);
            }
        },

        // Handle date change - auto-save previous day's data
        async handleDateChange(oldData) {
            // Check if there's any data worth saving
            const hasData = oldData.protein > 0 || oldData.carbs > 0 ||
                          oldData.fat > 0 || oldData.alcohol > 0;

            if (!hasData) {
                // No data to save, just reset
                this.resetMacros();
                return;
            }

            // Try to save old data to PocketBase (convert servings to grams including additional fat)
            try {
                const macroData = this.createMacroDataObject(
                    oldData.protein || 0,
                    oldData.carbs || 0,
                    oldData.fat || 0,
                    oldData.alcohol || 0
                );

                await pb.collection('mmm_macros').create(macroData);

                // Success - reset to 0 and show message
                this.resetMacros();

                // Show success message
                this.autoSaveMessage = "Yesterday's data saved automatically";
                setTimeout(() => {
                    this.autoSaveMessage = null;
                }, 5000);

                console.log('Previous day data auto-saved to PocketBase');
            } catch (error) {
                console.error('Failed to auto-save previous day data:', error);

                // Keep old data visible and show warning
                this.protein = oldData.protein || 0;
                this.carbs = oldData.carbs || 0;
                this.fat = oldData.fat || 0;
                this.alcohol = oldData.alcohol || 0;

                this.dateChangeWarning = `Data from ${oldData.date} couldn't be saved. Connect to internet and click "Reset Day" to save.`;
            }
        },

        // Load settings from PocketBase
        async loadSettingsFromPocketBase() {
            this.isLoadingSettings = true;
            this.settingsError = null;
            this.usingCachedSettings = false;

            try {
                // Fetch all settings for the current user
                const records = await pb.collection('mmm_settings').getFullList({
                    filter: `user_id = "${this.user.id}"`
                });

                // Map PocketBase keys to app properties
                const settingsMap = {};
                records.forEach(record => {
                    settingsMap[record.key] = record.value;
                });

                // Update targets
                this.targets.protein = parseInt(settingsMap['protein_servings'] || this.targets.protein);
                this.targets.carbs = parseInt(settingsMap['carbohydrate_servings'] || this.targets.carbs);
                this.targets.fat = parseInt(settingsMap['fat_servings'] || this.targets.fat);
                this.targets.alcohol = parseInt(settingsMap['alcohol_servings'] || this.targets.alcohol);

                // Update additional fat percent
                this.additionalFatPercent = parseFloat(settingsMap['additional_fat_percent'] || this.additionalFatPercent);

                // Update additional settings
                this.calorieExpenditure = parseFloat(settingsMap['calorie_expenditure'] || 0);
                this.deltaLbPerWeek = parseFloat(settingsMap['delta_lb_per_week'] || 0);

                // Cache to localStorage
                this.cacheSettingsToLocalStorage();

                console.log('Settings loaded from PocketBase');
            } catch (error) {
                console.error('Failed to load settings from PocketBase:', error);
                this.usingCachedSettings = true;
                // Fall back to localStorage (already loaded in loadData)
            } finally {
                this.isLoadingSettings = false;
            }
        },

        // Save settings to PocketBase
        async saveSettingsToPocketBase() {
            // Map of app properties to PocketBase keys
            const settingsToSave = [
                { key: 'protein_servings', value: this.targets.protein.toString() },
                { key: 'carbohydrate_servings', value: this.targets.carbs.toString() },
                { key: 'fat_servings', value: this.targets.fat.toString() },
                { key: 'alcohol_servings', value: this.targets.alcohol.toString() },
                { key: 'additional_fat_percent', value: this.additionalFatPercent.toString() },
                { key: 'calorie_expenditure', value: this.calorieExpenditure.toString() },
                { key: 'delta_lb_per_week', value: this.deltaLbPerWeek.toString() }
            ];

            // Save each setting (upsert)
            for (const setting of settingsToSave) {
                try {
                    // Try to find existing record
                    const existing = await pb.collection('mmm_settings').getFirstListItem(
                        `user_id = "${this.user.id}" && key = "${setting.key}"`
                    ).catch(() => null);

                    if (existing) {
                        // Update existing
                        await pb.collection('mmm_settings').update(existing.id, {
                            value: setting.value
                        });
                    } else {
                        // Create new
                        await pb.collection('mmm_settings').create({
                            user_id: this.user.id,
                            key: setting.key,
                            value: setting.value
                        });
                    }
                } catch (error) {
                    console.error(`Failed to save setting ${setting.key}:`, error);
                    throw error; // Re-throw to handle in saveSettings
                }
            }
        },

        // Refresh settings from PocketBase (called when opening settings view)
        async refreshSettings() {
            await this.loadSettingsFromPocketBase();
        },

        // Save settings
        async saveSettings() {
            this.isSavingSettings = true;
            this.settingsError = null;

            try {
                // Save to PocketBase first
                await this.saveSettingsToPocketBase();

                // Also save to localStorage (cache)
                this.cacheSettingsToLocalStorage();

                this.showSettings = false;
                console.log('Settings saved successfully');
            } catch (error) {
                console.error('Failed to save settings:', error);
                this.settingsError = 'Unable to save settings. Please check your connection and try again.';
            } finally {
                this.isSavingSettings = false;
            }
        },

        // Recompute calorie expenditure based on weight trend
        async recomputeCalorieExpenditure() {
            this.isRecomputing = true;
            this.recomputeError = null;

            try {
                // Use global.pb for testing, fallback to module pb
                const pbInstance = (typeof global !== 'undefined' && global.pb) || pb;

                // Fetch weight records from past 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const sevenDaysAgoStr = sevenDaysAgo.toISOString();

                const records = await pbInstance.collection('mmm_weight').getFullList({
                    filter: `user_id = "${this.user.id}" && created >= "${sevenDaysAgoStr}"`,
                    sort: 'created'
                });

                // Need at least 2 data points for regression
                if (records.length < 2) {
                    this.recomputeError = `Need at least 2 weight entries from past 7 days. Found ${records.length}.`;
                    return;
                }

                // Prepare data for linear regression
                const dataPoints = records.map(record => ({
                    time: new Date(record.created).getTime() / (1000 * 60 * 60 * 24), // Convert to days
                    weight: record.weight_lbs
                }));

                // Perform linear regression
                const n = dataPoints.length;
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

                dataPoints.forEach(point => {
                    sumX += point.time;
                    sumY += point.weight;
                    sumXY += point.time * point.weight;
                    sumX2 += point.time * point.time;
                });

                // Calculate slope and intercept
                const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                const intercept = (sumY - slope * sumX) / n;

                // Predict weights at start and end
                const timeStart = dataPoints[0].time;
                const timeEnd = dataPoints[dataPoints.length - 1].time;
                const yStart = slope * timeStart + intercept;
                const yEnd = slope * timeEnd + intercept;

                // Calculate regression difference (negative = weight loss)
                const regressionDifference = yEnd - yStart;

                // Fetch macro records from past 7 days
                const macroRecords = await pbInstance.collection('mmm_macros').getFullList({
                    filter: `user_id = "${this.user.id}" && created >= "${sevenDaysAgoStr}"`,
                    sort: 'created'
                });

                // Calculate total calories from macro records (database stores grams with additional fat already included)
                let sumOfWeekCalories = 0;

                macroRecords.forEach(record => {
                    // Database values are in grams with additional fat already calculated and included in the fat field
                    const proteinGrams = record.protein;
                    const carbGrams = record.carbohydrate;
                    const fatGrams = record.fat;  // Already includes additional fat from protein/carbs
                    const alcoholGrams = record.alcohol;

                    const proteinCal = proteinGrams * this.PROTEIN_CAL_PER_GRAM;
                    const carbCal = carbGrams * this.CARB_CAL_PER_GRAM;
                    const fatCal = fatGrams * this.FAT_CAL_PER_GRAM;
                    const alcoholCal = alcoholGrams * this.ALCOHOL_CAL_PER_GRAM;

                    sumOfWeekCalories += proteinCal + carbCal + fatCal + alcoholCal;
                });

                // Calculate adjustment using new formula
                const part1 = (this.deltaLbPerWeek - regressionDifference) * 500;
                const part2 = ((this.calorieExpenditure * 7) - sumOfWeekCalories) / 7;
                const adjustment = part1 - part2;

                // Update calorie expenditure
                this.calorieExpenditure += Math.round(adjustment / 2);

                console.log(`Recompute: regression_diff=${regressionDifference.toFixed(2)}, sum_calories=${sumOfWeekCalories.toFixed(0)}, part1=${part1.toFixed(0)}, part2=${part2.toFixed(0)}, adjustment=${adjustment.toFixed(0)}, new TDEE=${this.calorieExpenditure}`);
            } catch (error) {
                console.error('Failed to recompute calorie expenditure:', error);
                this.recomputeError = 'Unable to fetch weight data. Please check your connection.';
            } finally {
                this.isRecomputing = false;
            }
        },

        // Open weight dialog
        openWeightDialog() {
            this.weightInput = '';
            this.weightError = null;
            this.showWeightDialog = true;
        },

        // Close weight dialog
        closeWeightDialog() {
            this.showWeightDialog = false;
            this.weightInput = '';
            this.weightError = null;
        },

        // Save weight to PocketBase
        async saveWeight() {
            this.isSavingWeight = true;
            this.weightError = null;

            // Validate input
            const weight = parseFloat(this.weightInput);
            if (isNaN(weight) || weight <= 0) {
                this.weightError = 'Please enter a valid weight';
                this.isSavingWeight = false;
                return;
            }

            try {
                // Save to PocketBase
                await pb.collection('mmm_weight').create({
                    user_id: this.user.id,
                    weight_lbs: weight
                });

                console.log('Weight logged successfully:', weight);
                this.closeWeightDialog();
            } catch (error) {
                console.error('Failed to save weight:', error);
                this.weightError = 'Unable to save weight. Please check your connection and try again.';
            } finally {
                this.isSavingWeight = false;
            }
        },

        // Manual reset of daily servings
        async resetDaily() {
            // Clear any previous error
            this.resetError = null;
            this.isResetting = true;

            try {
                // Save current state to PocketBase (use computed grams properties)
                const macroData = this.createMacroDataObject(this.protein, this.carbs, this.fat, this.alcohol);

                await pb.collection('mmm_macros').create(macroData);

                // Only reset client state if save succeeded
                this.resetMacros();

                console.log('Day reset successfully and saved to PocketBase');
            } catch (error) {
                console.error('Failed to save to PocketBase:', error);
                this.resetError = 'Unable to sync with server. Please check your connection and try again.';
            } finally {
                this.isResetting = false;
            }
        }
    };
}

// Make foodTracker globally available (for both browser and tests)
if (typeof window !== 'undefined') {
    window.foodTracker = foodTracker;
}
if (typeof globalThis !== 'undefined') {
    globalThis.foodTracker = foodTracker;
}