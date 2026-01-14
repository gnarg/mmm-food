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

        // Computed properties for grams consumed
        get proteinGrams() {
            return Math.round(this.protein * this.PROTEIN_GRAMS);
        },

        get carbGrams() {
            return Math.round(this.carbs * this.CARB_GRAMS);
        },

        get fatGrams() {
            const additionalFatFactor = this.additionalFatPercent / 100;
            const directFat = this.fat * this.FAT_GRAMS;
            const additionalFat = (this.protein * this.PROTEIN_GRAMS + this.carbs * this.CARB_GRAMS) * additionalFatFactor;
            return Math.round(directFat + additionalFat);
        },

        get alcoholGrams() {
            return Math.round(this.alcohol * this.ALCOHOL_GRAMS);
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
                this.loadData();
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
        async resetDaily() {
            // Clear any previous error
            this.resetError = null;
            this.isResetting = true;

            try {
                // Save current state to PocketBase
                const macroData = {
                    protein: this.protein,
                    carbohydrate: this.carbs,  // Note: PocketBase uses "carbohydrate"
                    fat: this.fat,
                    alcohol: this.alcohol,
                    user_id: this.user.id
                };

                await pb.collection('mmm_macros').create(macroData);

                // Only reset client state if save succeeded
                this.protein = 0;
                this.carbs = 0;
                this.fat = 0;
                this.alcohol = 0;
                this.saveData();

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