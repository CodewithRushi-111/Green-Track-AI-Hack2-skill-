// GreenTrack AI - App Bootstrap and Main Event Handlers

document.addEventListener('DOMContentLoaded', async () => {
    const state = window.EcoState;
    const api = window.EcoApi;
    const router = window.EcoRouter;

    // Theme Toggle Handler
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        }
    };

    // Apply initial theme
    applyTheme(state.theme);

    themeBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        state.setTheme(nextTheme);
    });

    // Global UI Sync Handler (Subscribes to EcoState changes)
    state.subscribe((currentState) => {
        applyTheme(currentState.theme);

        // Sync points badge
        const pointsBadge = document.getElementById('user-points-badge');
        const pointsVal = document.getElementById('user-points-val');
        const authStatusArea = document.getElementById('auth-status-area');
        const nav = document.getElementById('nav-links');

        if (currentState.token && currentState.user) {
            // Logged in
            pointsBadge.classList.remove('hidden');
            pointsVal.textContent = currentState.user.points;
            
            // Show username and signout button
            authStatusArea.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 0.9rem; color: var(--text-secondary); display: none; @media (min-width: 600px) { display: inline; }">
                        Hi, <strong>${currentState.user.username}</strong>
                    </span>
                    <button class="btn btn-secondary btn-sm" id="logout-btn" style="padding: 6px 12px; font-size: 0.85rem;">Sign Out</button>
                </div>
            `;

            // Bind logout
            document.getElementById('logout-btn').addEventListener('click', () => {
                state.clearAuth();
                window.location.hash = '#/login';
            });

            // Make sure navigation items are accessible in header
            nav.style.display = 'flex';
        } else {
            // Logged out
            pointsBadge.classList.add('hidden');
            authStatusArea.innerHTML = `
                <a href="#/login" class="btn btn-primary" id="auth-btn">Sign In</a>
            `;
            nav.style.display = 'none';
        }
    });

    // Check token validity on boot
    if (state.token) {
        try {
            const profile = await api.getProfile();
            state.setAuth(profile.user, state.token); // Sync user points/stats
        } catch (e) {
            console.error("Token verification on launch failed. Clearing auth state.");
            state.clearAuth();
        }
    } else {
        // Clear state variables just in case
        state.clearAuth();
    }

    // Initialize SPA router
    router.init();
});
