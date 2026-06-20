// GreenTrack AI - Client-Side Hash Router

const EcoRouter = {
    routes: {
        '#/dashboard': { render: (state, el) => window.EcoComponents.renderDashboard(state, el), protected: true, navId: 'nav-dashboard' },
        '#/tracker': { render: (state, el) => window.EcoComponents.renderTracker(state, el), protected: true, navId: 'nav-tracker' },
        '#/recommendations': { render: (state, el) => window.EcoComponents.renderRecommendations(state, el), protected: true, navId: 'nav-recommendations' },
        '#/challenges': { render: (state, el) => window.EcoComponents.renderChallenges(state, el), protected: true, navId: 'nav-challenges' },
        '#/offsets': { render: (state, el) => window.EcoComponents.renderOffsets(state, el), protected: true, navId: 'nav-offsets' },
        '#/login': { render: (state, el) => window.EcoComponents.renderLogin(state, el), protected: false },
        '#/register': { render: (state, el) => window.EcoComponents.renderRegister(state, el), protected: false }

    },

    init() {
        window.addEventListener('hashchange', () => this.handleRouting());
        window.addEventListener('DOMContentLoaded', () => this.handleRouting());
    },

    async handleRouting() {
        const outlet = document.getElementById('app-router-outlet');
        if (!outlet) return;

        let hash = window.location.hash || '#/dashboard';
        
        // Handle root hash edge cases
        if (hash === '#/' || hash === '') {
            hash = '#/dashboard';
        }

        const route = this.routes[hash];

        if (!route) {
            // 404 - fallback to dashboard/login
            window.location.hash = window.EcoState.token ? '#/dashboard' : '#/login';
            return;
        }

        // Auth Guards
        if (route.protected && !window.EcoState.token) {
            window.location.hash = '#/login';
            return;
        }

        if (!route.protected && window.EcoState.token) {
            window.location.hash = '#/dashboard';
            return;
        }

        // Show loading indicator
        outlet.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading view...</p>
            </div>
        `;

        // Update active nav links
        this.updateActiveNav(route.navId);

        try {
            // Load required global data for dashboard before render
            if (hash === '#/dashboard') {
                try {
                    const [historyData, compareData, offsetData] = await Promise.all([
                        window.EcoApi.getHistory('all'),
                        window.EcoApi.getComparison(),
                        window.EcoApi.getOffsets().catch(() => ({ transactions: [] }))
                    ]);
                    window.EcoState.history = historyData;
                    window.EcoState.comparison = compareData;
                    window.EcoState.offsets = offsetData.transactions || [];
                } catch (e) {
                    console.error("Failed to load dashboard data", e);
                    // Continue rendering, components will handle empty states or errors
                }
            }

            if (hash === '#/offsets') {
                try {
                    const offsetData = await window.EcoApi.getOffsets();
                    window.EcoState.offsets = offsetData.transactions;
                    window.EcoState.offsetProjects = offsetData.projects;
                    window.EcoState.totalOffset = offsetData.total_offset;
                } catch (e) {
                    console.error("Failed to load offsets data", e);
                }
            }


            // Render view
            route.render(window.EcoState, outlet);
        } catch (error) {
            outlet.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px;">
                    <span style="font-size: 3rem;">⚠️</span>
                    <h2 style="margin-top: 15px; color: var(--error-color);">Rendering Failed</h2>
                    <p style="color: var(--text-secondary); margin-top: 10px; margin-bottom: 20px;">
                        ${error.message || 'An error occurred while loading this page.'}
                    </p>
                    <button onclick="window.location.reload()" class="btn btn-secondary">Reload App</button>
                </div>
            `;
        }
    },

    updateActiveNav(activeNavId) {
        // Reset active link styles
        const links = document.querySelectorAll('.nav-link');
        links.forEach(l => l.classList.remove('active'));

        if (activeNavId) {
            const activeLink = document.getElementById(activeNavId);
            if (activeLink) activeLink.classList.add('active');
        }
    }
};

window.EcoRouter = EcoRouter;
