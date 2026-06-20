// GreenTrack AI - API Client Wrapper

const EcoApi = {
    async request(endpoint, options = {}) {
        const url = `/api${endpoint}`;
        
        // Prepare headers
        options.headers = options.headers || {};
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        
        // Inject Auth Token
        if (window.EcoState && window.EcoState.token) {
            options.headers['Authorization'] = `Bearer ${window.EcoState.token}`;
        }
        
        try {
            const response = await fetch(url, options);
            
            // Check for unauthorized access (expired token)
            if (response.status === 401) {
                console.warn("Unauthorized API call. Clearing token and redirecting to login.");
                if (window.EcoState) {
                    window.EcoState.clearAuth();
                }
                window.location.hash = '#/login';
                const errData = await response.json().catch(() => ({}));
                throw { status: 401, message: errData.message || 'Session expired. Please log in again.' };
            }
            
            const responseData = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw {
                    status: response.status,
                    error: responseData.error || 'API Error',
                    message: responseData.message || 'An unexpected error occurred.'
                };
            }
            
            return responseData;
        } catch (error) {
            // Forward formatted errors
            if (error.status) throw error;
            throw { status: 500, error: 'Network Error', message: 'Failed to communicate with the server.' };
        }
    },

    // Auth Calls
    register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    },

    login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    demoLogin() {
        return this.request('/auth/demo', {
            method: 'POST'
        });
    },

    getProfile() {
        return this.request('/auth/profile');
    },

    // Footprint Tracker Calls
    createEntry(transportation, energy, waste, diet) {
        return this.request('/tracker/entry', {
            method: 'POST',
            body: JSON.stringify({ transportation, energy, waste, diet })
        });
    },

    getHistory(period = 'all') {
        return this.request(`/tracker/history?period=${period}`);
    },

    getComparison() {
        return this.request('/tracker/compare');
    },

    // Recommendations Call
    getRecommendations() {
        return this.request('/recommendations');
    },

    // Challenge Calls
    getChallenges() {
        return this.request('/challenges');
    },

    acceptChallenge(challengeId) {
        return this.request(`/challenges/accept/${challengeId}`, {
            method: 'POST'
        });
    },

    submitChallengeProof(challengeId, proofText) {
        return this.request(`/challenges/submit/${challengeId}`, {
            method: 'POST',
            body: JSON.stringify({ proof_text: proofText })
        });
    },

    // Carbon Offset Calls
    getOffsets() {
        return this.request('/offsets');
    },

    purchaseOffset(projectId) {
        return this.request('/offsets/purchase', {
            method: 'POST',
            body: JSON.stringify({ project_id: projectId })
        });
    },

    async chatWithAdvisorStream(message, history, onChunk, onDone, onError) {
        try {
            const token = window.EcoState ? window.EcoState.token : localStorage.getItem('greentrack_token');
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ message, history })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP error! status: ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    
                    if (trimmed.startsWith("data:")) {
                        const dataStr = trimmed.slice(5).trim();
                        if (dataStr === "[DONE]") {
                            onDone();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.chunk) {
                                onChunk(parsed.chunk);
                            }
                        } catch (e) {
                            console.error("Error parsing chat stream chunk", e);
                        }
                    }
                }
            }
            onDone();
        } catch (err) {
            if (onError) onError(err);
        }
    }
};

window.EcoApi = EcoApi;

