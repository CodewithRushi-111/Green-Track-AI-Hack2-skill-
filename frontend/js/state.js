// GreenTrack AI - Central State Store

const EcoState = {
    // Auth State
    user: JSON.parse(localStorage.getItem('greentrack_user') || 'null'),
    token: localStorage.getItem('greentrack_token') || null,
    
    // Theme State
    theme: localStorage.getItem('greentrack_theme') || 'dark',
    
    // Application Data
    history: [],
    comparison: null,
    recommendations: null,
    challenges: {
        available: [],
        active: [],
        completed: []
    },

    // Listeners for state changes
    listeners: [],

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notify() {
        this.listeners.forEach(listener => listener(this));
    },

    setAuth(user, token) {
        this.user = user;
        this.token = token;
        if (user) {
            localStorage.setItem('greentrack_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('greentrack_user');
        }
        if (token) {
            localStorage.setItem('greentrack_token', token);
        } else {
            localStorage.removeItem('greentrack_token');
        }
        this.notify();
    },

    clearAuth() {
        this.setAuth(null, null);
        this.history = [];
        this.comparison = null;
        this.recommendations = null;
        this.challenges = {
            available: [],
            active: [],
            completed: []
        };
        this.offsets = [];
        this.offsetProjects = [];
        this.totalOffset = 0;
        this.notify();

    },

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('greentrack_theme', theme);
        this.notify();
    },

    setHistory(history) {
        this.history = history;
        this.notify();
    },

    setComparison(comparison) {
        this.comparison = comparison;
        this.notify();
    },

    setRecommendations(recommendations) {
        this.recommendations = recommendations;
        this.notify();
    },

    setChallenges(challenges) {
        this.challenges = challenges;
        this.notify();
    },

    updatePoints(newPoints) {
        if (this.user) {
            this.user.points = newPoints;
            localStorage.setItem('greentrack_user', JSON.stringify(this.user));
            this.notify();
        }
    }
};

window.EcoState = EcoState;
