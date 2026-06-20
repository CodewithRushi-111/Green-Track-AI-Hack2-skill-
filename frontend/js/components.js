// GreenTrack AI - UI Components Library

const EcoComponents = {
    // Utility: Focus Trapping for accessibility
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Remove previous listener if any
        if (container._focusTrapHandler) {
            container.removeEventListener('keydown', container._focusTrapHandler);
        }
        
        container._focusTrapHandler = function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };
        
        container.addEventListener('keydown', container._focusTrapHandler);
        firstElement.focus();
    },

    // 1. Dashboard View
    renderDashboard(state, container) {
        if (!state.token) {
            window.location.hash = '#/login';
            return;
        }

        const username = state.user ? state.user.username : 'User';
        const points = state.user ? state.user.points : 0;
        
        // Calculate totals and statistics
        const entries = state.history || [];
        const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
        const totalEntries = entries.length;
        
        let avgCarbon = 0.0;
        if (totalEntries > 0) {
            avgCarbon = entries.reduce((acc, curr) => acc + curr.total_emission, 0) / totalEntries;
        }

        let changePercentage = 0;
        let isImproving = true;
        if (totalEntries >= 2) {
            const prevEntry = entries[totalEntries - 2];
            if (prevEntry.total_emission > 0) {
                changePercentage = ((lastEntry.total_emission - prevEntry.total_emission) / prevEntry.total_emission) * 100;
            }
            if (changePercentage > 0) {
                isImproving = false; // carbon footprint went up
            }
        }

        // Title and badge determination based on earned points
        let userTitle = "Eco Apprentice 🍀";
        let titleColor = "hsl(var(--hue-emerald), 70%, 55%)";
        let bgStyle = "rgba(16, 185, 129, 0.1)";
        if (points > 300) {
            userTitle = "Planet Guardian 🌍";
            titleColor = "hsl(142, 70%, 50%)";
            bgStyle = "rgba(34, 197, 94, 0.15)";
        } else if (points > 100) {
            userTitle = "Carbon Crusader ⚡";
            titleColor = "hsl(45, 95%, 55%)";
            bgStyle = "rgba(234, 179, 8, 0.15)";
        } else if (points > 0) {
            userTitle = "Green Steward 🌱";
            titleColor = "hsl(100, 75%, 55%)";
            bgStyle = "rgba(132, 204, 22, 0.15)";
        }

        const comp = state.comparison || { net_average: avgCarbon, total_offset: 0.0, status: 'Active' };

        // Generate Category Breakdown HTML
        let breakdownHTML = "";
        if (lastEntry) {
            const total = lastEntry.total_emission || 1;
            const transPct = (lastEntry.transportation / total) * 100;
            const energyPct = (lastEntry.energy / total) * 100;
            const wastePct = (lastEntry.waste / total) * 100;
            const dietPct = (lastEntry.diet / total) * 100;

            breakdownHTML = `
                <div style="display: flex; flex-direction: column; gap: 18px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; font-weight: 500;">
                            <span>🚗 Transportation</span>
                            <span style="color: var(--text-secondary);">${lastEntry.transportation.toFixed(1)} kg (${transPct.toFixed(0)}%)</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${transPct}%; background: hsl(var(--hue-crimson), 80%, 55%); border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; font-weight: 500;">
                            <span>⚡ Household Energy</span>
                            <span style="color: var(--text-secondary);">${lastEntry.energy.toFixed(1)} kg (${energyPct.toFixed(0)}%)</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${energyPct}%; background: hsl(45, 90%, 50%); border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; font-weight: 500;">
                            <span>🗑️ Waste & Trash</span>
                            <span style="color: var(--text-secondary);">${lastEntry.waste.toFixed(1)} kg (${wastePct.toFixed(0)}%)</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${wastePct}%; background: hsl(var(--hue-sky), 80%, 50%); border-radius: 4px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 6px; font-weight: 500;">
                            <span>🥗 Diet & Nutrition</span>
                            <span style="color: var(--text-secondary);">${lastEntry.diet.toFixed(1)} kg (${dietPct.toFixed(0)}%)</span>
                        </div>
                        <div style="height: 8px; width: 100%; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${dietPct}%; background: var(--accent-color); border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            breakdownHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 45px 10px; font-style: italic;">
                    <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📊</span>
                    No footprint entries logged. Add your first log entry to view the category breakdown!
                </div>
            `;
        }

        // Build world map nodes highlighting user funded impact
        const fundedProjects = new Set();
        (state.offsets || []).forEach(t => {
            const name = (t.project_name || '').toLowerCase();
            if (name.includes('reforestation') || name.includes('madagascar')) {
                fundedProjects.add('reforestation');
            } else if (name.includes('solar') || name.includes('community solar')) {
                fundedProjects.add('solar');
            } else if (name.includes('bubble') || name.includes('ocean')) {
                fundedProjects.add('bubble');
            } else if (name.includes('cookstove')) {
                fundedProjects.add('cookstoves');
            }
        });
        const mapNodes = [
            { id: 'reforestation', cx: 488, cy: 265, name: 'Madagascar Reforestation', color: 'var(--accent-color)', emoji: '🌳', location: 'Madagascar' },
            { id: 'solar', cx: 555, cy: 150, name: 'Community Solar Array', color: '#ffd700', emoji: '☀️', location: 'India' },
            { id: 'bubble', cx: 390, cy: 92, name: 'Ocean Bubble Barrier', color: 'hsl(var(--hue-sky), 80%, 50%)', emoji: '🌊', location: 'North Sea' },
            { id: 'cookstoves', cx: 460, cy: 205, name: 'Clean Cookstoves Project', color: '#f97316', emoji: '🍳', location: 'Kenya' }
        ];

        let mapNodesHTML = "";
        mapNodes.forEach(node => {
            const isFunded = fundedProjects.has(node.id);
            const activeColor = node.color;
            const size = isFunded ? 7 : 4.5;
            const pulseSize = isFunded ? 15 : 9;
            const opacity = isFunded ? 1.0 : 0.45;
            
            mapNodesHTML += `
                <g class="map-point" style="cursor: pointer;" data-name="${node.name}" data-location="${node.location}" data-status="${isFunded ? 'Funded & Active 🟢' : 'Available for Funding ⚪'}" data-emoji="${node.emoji}">
                    <!-- Pulse -->
                    <circle cx="${node.cx}" cy="${node.cy}" r="${pulseSize}" fill="${activeColor}" opacity="${isFunded ? 0.35 : 0.15}" class="map-node-pulse" />
                    <!-- Solid center -->
                    <circle cx="${node.cx}" cy="${node.cy}" r="${size}" fill="${activeColor}" opacity="${opacity}" stroke="${isFunded ? '#ffffff' : 'none'}" stroke-width="1" />
                </g>
            `;
        });

        const worldMapSVG = `
            <svg viewBox="0 0 800 340" style="width: 100%; height: auto; display: block; overflow: visible;">
                <!-- Stylized low-poly outline paths for world continents -->
                <!-- North America -->
                <path d="M 50 60 L 120 50 L 180 30 L 220 60 L 250 90 L 220 110 L 190 120 L 160 150 L 120 200 L 110 220 L 95 220 L 90 180 L 110 160 L 100 140 L 60 120 L 40 80 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1.2" stroke-linejoin="round" />
                
                <!-- South America -->
                <path d="M 160 200 L 190 220 L 210 240 L 220 270 L 190 330 L 170 360 L 160 360 L 150 320 L 140 280 L 130 240 L 140 220 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1.2" stroke-linejoin="round" />
                
                <!-- Africa -->
                <path d="M 370 140 L 410 130 L 440 140 L 470 170 L 480 200 L 485 225 L 480 260 L 450 300 L 430 330 L 420 330 L 415 290 L 390 240 L 365 220 L 350 180 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1.2" stroke-linejoin="round" />
                
                <!-- Eurasia -->
                <path d="M 360 120 L 380 70 L 420 50 L 480 30 L 560 30 L 640 25 L 720 30 L 750 70 L 740 100 L 720 140 L 680 160 L 640 200 L 610 220 L 570 180 L 530 170 L 490 160 L 450 150 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1.2" stroke-linejoin="round" />
                
                <!-- Australia -->
                <path d="M 640 260 L 680 250 L 710 260 L 700 300 L 670 310 L 630 290 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1.2" stroke-linejoin="round" />
                
                <!-- Madagascar -->
                <path d="M 488 265 L 495 262 L 492 275 L 487 278 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" stroke-width="1.2" stroke-linejoin="round" />
                
                <!-- Small Islands -->
                <circle cx="365" cy="80" r="3.5" fill="var(--bg-tertiary)" stroke="var(--border-color)" />
                <circle cx="715" cy="90" r="3.5" fill="var(--bg-tertiary)" stroke="var(--border-color)" />
                <circle cx="615" cy="225" r="4.5" fill="var(--bg-tertiary)" stroke="var(--border-color)" />
                
                <!-- Project Nodes -->
                ${mapNodesHTML}
            </svg>
        `;

        container.innerHTML = `
            <div class="dashboard-hero glass-card animate-on-scroll" style="position: relative; overflow: hidden; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between;">
                <!-- Decorative background leaves -->
                <div style="position: absolute; right: -20px; bottom: -20px; font-size: 8rem; opacity: 0.05; pointer-events: none;">🌿</div>
                
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <h1 class="page-title" style="margin: 0; font-size: 2rem;">Welcome back, ${username}!</h1>
                        <span class="meta-tag" style="background-color: ${bgStyle}; color: ${titleColor}; border-color: ${titleColor}33; font-weight: 700; font-size: 0.85rem; padding: 4px 12px; border-radius: 20px;">
                            ${userTitle}
                        </span>
                    </div>
                    <p style="color: var(--text-secondary); max-width: 600px; margin-top: 10px; font-size: 0.95rem; line-height: 1.5;">
                        Track emissions, take part in eco challenges, and fund verified reforestation or clean solar projects using your Green Points to bring your Net Footprint to zero.
                    </p>
                </div>
                <div>
                    <a href="#/tracker" class="btn btn-primary" style="box-shadow: 0 4px 15px hsla(var(--hue-emerald), 70%, 45%, 0.3);">
                        <span>🚗</span> Track Footprint
                    </a>
                </div>
            </div>

            <div class="stat-cards-row" style="margin-top: 30px;">
                <div class="stat-card animate-on-scroll" style="position: relative; overflow: hidden; border-left: 4px solid var(--accent-color);">
                    <span class="stat-label">Net Carbon Footprint</span>
                    <span class="stat-value count-up" data-target="${comp.net_average}" data-decimals="1" data-suffix="kg CO₂">0.0 kg CO₂</span>
                    <span class="stat-trend" style="color: var(--text-secondary); font-weight: 500;">🌱 Monthly Net average</span>
                </div>
                <div class="stat-card animate-on-scroll" style="position: relative; overflow: hidden; border-left: 4px solid #ffd700;">
                    <span class="stat-label">Green Points Balance</span>
                    <span class="stat-value count-up" data-target="${points}" data-decimals="0" data-suffix="pts">0 pts</span>
                    <span class="stat-trend" style="color: var(--text-secondary); font-weight: 500;">🌟 Redeem on Offsets page</span>
                </div>
                <div class="stat-card animate-on-scroll" style="position: relative; overflow: hidden; border-left: 4px solid hsl(var(--hue-sky), 80%, 50%);">
                    <span class="stat-label">Total Carbon Offsetted</span>
                    <span class="stat-value count-up" data-target="${comp.total_offset}" data-decimals="1" data-suffix="kg CO₂">0.0 kg CO₂</span>
                    <span class="stat-trend" style="color: var(--text-secondary); font-weight: 500;">🌊 Ocean & Reforestation</span>
                </div>
            </div>

            <div class="dashboard-grid">
                <!-- LEFT COLUMN -->
                <div style="display: flex; flex-direction: column; gap: 30px;">
                    
                    <!-- Line Trend Chart -->
                    <div class="glass-card chart-container animate-on-scroll" style="margin-top: 0;">
                        <div class="chart-header">
                            <div>
                                <h2 style="font-size: 1.25rem; font-weight: 700;">Emissions Trend</h2>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">Your emissions history logs over time</p>
                            </div>
                            <div class="chart-controls">
                                <button class="chart-btn active" data-period="all">All</button>
                                <button class="chart-btn" data-period="3m">3M</button>
                                <button class="chart-btn" data-period="6m">6M</button>
                                <button class="chart-btn" data-period="ytd">YTD</button>
                            </div>
                        </div>
                        <div id="trend-chart-wrapper" style="position: relative;">
                            <!-- SVG line chart gets injected here -->
                            <div class="loading-container" style="min-height: 250px;">
                                <div class="spinner"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Category Breakdown -->
                    <div class="glass-card animate-on-scroll" style="padding: 24px;">
                        <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 5px;">Source Breakdown</h2>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">Percentage mix of your last logged carbon footprint</p>
                        ${breakdownHTML}
                    </div>

                </div>

                <!-- RIGHT COLUMN -->
                <div style="display: flex; flex-direction: column; gap: 30px;">
                    
                    <!-- Target Comparison Bar Chart -->
                    <div class="glass-card chart-container animate-on-scroll" style="margin-top: 0;">
                        <h2 style="font-size: 1.25rem; font-weight: 700;">Climate Benchmarks</h2>
                        <p class="stat-label" style="margin-bottom: 20px; text-transform: none; letter-spacing: normal;">How your net emissions stack up</p>
                        <div id="comparison-chart-wrapper">
                            <!-- SVG comparison chart gets injected here -->
                            <div class="loading-container" style="min-height: 250px;">
                                <div class="spinner"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions Widget -->
                    <div class="glass-card animate-on-scroll" style="padding: 24px;">
                        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 15px;">Quick Actions</h2>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <a href="#/challenges" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; font-size: 0.9rem; padding: 12px 15px;">
                                <span style="font-size: 1.2rem; margin-right: 5px;">🔥</span> Earn Eco Points (Challenges)
                            </a>
                            <a href="#/recommendations" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; font-size: 0.9rem; padding: 12px 15px;">
                                <span style="font-size: 1.2rem; margin-right: 5px;">💡</span> Get AI Recommendations
                            </a>
                            <a href="#/offsets" class="btn btn-secondary" style="justify-content: flex-start; text-align: left; font-size: 0.9rem; padding: 12px 15px;">
                                <span style="font-size: 1.2rem; margin-right: 5px;">🌳</span> Plant Trees & Offset Carbon
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Full Width Project Impact Map Card -->
            <div class="glass-card animate-on-scroll" style="margin-top: 30px; padding: 24px; position: relative;">
                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 5px;">Global Project Impact Map</h2>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">Geographical distribution of your funded carbon offset projects</p>
                <div style="position: relative; width: 100%; background: rgba(0,0,0,0.12); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color); overflow: hidden;">
                    ${worldMapSVG}
                    <div id="map-tooltip" class="map-tooltip"></div>
                </div>
            </div>
        `;

        // Render charts once elements are on page
        this.renderHistoryTrendChart(state, 'all');
        this.renderComparisonChart(state);

        // Trigger IntersectionObserver for Scroll Animations
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('appear');
                }
            });
        }, { threshold: 0.05 });
        container.querySelectorAll('.animate-on-scroll').forEach(el => scrollObserver.observe(el));

        // Trigger Count-Up Animations for stat counters
        const countUps = container.querySelectorAll('.count-up');
        countUps.forEach(el => {
            const targetVal = parseFloat(el.getAttribute('data-target') || '0');
            const decimals = parseInt(el.getAttribute('data-decimals') || '0');
            const suffix = el.getAttribute('data-suffix') || '';
            
            let startTimestamp = null;
            const duration = 1200; // 1.2 seconds animation
            
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const current = progress * targetVal;
                
                el.innerHTML = `${current.toFixed(decimals)} <span style="font-size: 0.9rem; font-weight: 500;">${suffix}</span>`;
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        });

        // Dynamic interactive tooltips for the world map nodes
        const mapPoints = container.querySelectorAll('.map-point');
        const mapTooltip = container.querySelector('#map-tooltip');
        
        mapPoints.forEach(point => {
            point.addEventListener('mouseenter', (e) => {
                const name = point.getAttribute('data-name');
                const loc = point.getAttribute('data-location');
                const status = point.getAttribute('data-status');
                const emoji = point.getAttribute('data-emoji');
                
                mapTooltip.innerHTML = `
                    <div style="font-weight:700; font-family:var(--font-title);">${emoji} ${name}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Location: ${loc}</div>
                    <div style="font-size:0.75rem; font-weight:600; margin-top:4px;">Status: ${status}</div>
                `;
                mapTooltip.style.opacity = '1';
                
                // Position tooltip relative to container coordinates
                const rect = point.getBoundingClientRect();
                const parentRect = point.parentNode.getBoundingClientRect();
                mapTooltip.style.left = `${rect.left - parentRect.left - 40}px`;
                mapTooltip.style.top = `${rect.top - parentRect.top - 65}px`;
            });

            point.addEventListener('mouseleave', () => {
                mapTooltip.style.opacity = '0';
            });
        });

        // Bind chart controls
        const controls = container.querySelectorAll('.chart-btn');
        controls.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                controls.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = btn.getAttribute('data-period');
                
                // Show loader while fetching
                const wrapper = container.querySelector('#trend-chart-wrapper');
                wrapper.innerHTML = `
                    <div class="loading-container" style="min-height: 250px;">
                        <div class="spinner"></div>
                    </div>
                `;
                
                try {
                    const data = await window.EcoApi.getHistory(period);
                    state.history = data; // Keep in sync
                    this.renderHistoryTrendChart(state, period);
                } catch (err) {
                    wrapper.innerHTML = `<div class="alert-banner alert-danger">${err.message || 'Error updating chart'}</div>`;
                }
            });
        });
    },

    renderHistoryTrendChart(state, period) {
        const container = document.getElementById('trend-chart-wrapper');
        if (!container) return;

        const entries = state.history || [];
        if (entries.length === 0) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; text-align: center; color: var(--text-secondary);">
                    <span style="font-size: 2.2rem; margin-bottom: 8px;">📊</span>
                    <p style="font-size: 0.95rem;">No footprint records available yet.</p>
                    <a href="#/tracker" class="btn btn-secondary btn-sm" style="margin-top: 12px; padding: 6px 14px; font-size: 0.85rem; border-radius: 6px;">Log First Entry</a>
                </div>
            `;
            return;
        }

        // Configuration
        const width = 500;
        const height = 220;
        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 20;
        const paddingBottom = 30;

        // Map values
        const xValues = entries.map((_, i) => i);
        const yValues = entries.map(e => e.total_emission);
        
        const minX = 0;
        const maxX = Math.max(1, entries.length - 1);
        const minY = 0;
        const maxY = Math.max(10, Math.max(...yValues) * 1.15); // Add 15% head room

        // Translate to SVG Coordinates
        const getX = (index) => paddingLeft + (index / maxX) * (width - paddingLeft - paddingRight);
        const getY = (val) => height - paddingBottom - (val / maxY) * (height - paddingTop - paddingBottom);

        // Build Line Path
        let pathD = "";
        entries.forEach((entry, i) => {
            const x = getX(i);
            const y = getY(entry.total_emission);
            if (i === 0) pathD += `M ${x} ${y}`;
            else pathD += ` L ${x} ${y}`;
        });

        // Area path for gradient fill underneath the line
        let areaPath = "";
        if (entries.length > 0) {
            areaPath = `${pathD} L ${getX(entries.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`;
        }

        // Grid lines (3 horizontal grid lines)
        const gridLines = [];
        for (let i = 1; i <= 3; i++) {
            const val = (maxY / 4) * i;
            const y = getY(val);
            gridLines.push(`
                <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--chart-grid)" stroke-dasharray="4" />
                <text x="${paddingLeft - 8}" y="${y + 4}" fill="var(--text-secondary)" font-size="9" text-anchor="end">${Math.round(val)}</text>
            `);
        }

        // Build SVG HTML
        let pointsHTML = "";
        entries.forEach((entry, i) => {
            const x = getX(i);
            const y = getY(entry.total_emission);
            const dateStr = new Date(entry.recorded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
            pointsHTML += `
                <circle cx="${x}" cy="${y}" r="5" fill="var(--chart-line)" class="chart-point" data-val="${entry.total_emission.toFixed(1)}" data-date="${dateStr}" style="cursor: pointer; transition: r 0.2s;"/>
            `;
        });

        // X Axis labels (First and Last entries)
        const firstDate = new Date(entries[0].recorded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        const lastDate = new Date(entries[entries.length - 1].recorded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        const xAxisHTML = `
            <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight}" y2="${height - paddingBottom}" stroke="var(--border-color)" />
            <text x="${paddingLeft}" y="${height - 10}" fill="var(--text-secondary)" font-size="9" text-anchor="start">${firstDate}</text>
            ${entries.length > 1 ? `<text x="${width - paddingRight}" y="${height - 10}" fill="var(--text-secondary)" font-size="9" text-anchor="end">${lastDate}</text>` : ''}
        `;

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="line-chart">
                <defs>
                    <linearGradient id="chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="var(--chart-line)" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="var(--chart-line)" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <!-- Grid Lines -->
                ${gridLines.join('')}
                <!-- Area Path Fill -->
                ${areaPath ? `<path d="${areaPath}" fill="url(#chart-area-grad)" />` : ''}
                <!-- Line Path -->
                <path d="${pathD}" fill="none" stroke="var(--chart-line)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Points -->
                ${pointsHTML}
                <!-- X Axis -->
                ${xAxisHTML}
            </svg>
            <div id="chart-tooltip" class="chart-tooltip"></div>
        `;

        // Interactive Tooltips
        const points = container.querySelectorAll('.chart-point');
        const tooltip = container.querySelector('#chart-tooltip');
        
        points.forEach(point => {
            point.addEventListener('mouseenter', (e) => {
                point.setAttribute('r', '8');
                const val = point.getAttribute('data-val');
                const date = point.getAttribute('data-date');
                tooltip.innerHTML = `<strong>${val} kg CO₂</strong><br/>${date}`;
                tooltip.style.opacity = '1';
                
                // Position relative to parent container
                const rect = point.getBoundingClientRect();
                const parentRect = container.getBoundingClientRect();
                tooltip.style.left = `${rect.left - parentRect.left - 40}px`;
                tooltip.style.top = `${rect.top - parentRect.top - 50}px`;
            });
            
            point.addEventListener('mouseleave', () => {
                point.setAttribute('r', '5');
                tooltip.style.opacity = '0';
            });
        });
    },


    // Render SVG Comparison Bar Chart
    renderComparisonChart(state) {
        const container = document.getElementById('comparison-chart-wrapper');
        if (!container) return;

        const compare = state.comparison || { user_average: 0.0, national_target: 600.0, global_target: 350.0 };

        const width = 300;
        const height = 220;
        const paddingLeft = 30;
        const paddingRight = 30;
        const paddingTop = 20;
        const paddingBottom = 40;

        const maxVal = Math.max(100, Math.max(compare.user_average, compare.national_target, compare.global_target) * 1.15);

        // Chart layout
        const barWidth = 40;
        const spacing = 45;
        
        const getY = (val) => height - paddingBottom - (val / maxVal) * (height - paddingTop - paddingBottom);
        const getBarHeight = (val) => (val / maxVal) * (height - paddingTop - paddingBottom);

        const xUser = paddingLeft + spacing;
        const xNational = xUser + barWidth + spacing;
        const xGlobal = xNational + barWidth + spacing;

        const yUser = getY(compare.user_average);
        const yNational = getY(compare.national_target);
        const yGlobal = getY(compare.global_target);

        // Color determination for user average
        let userColor = 'var(--accent-color)'; // Green/Emerald
        if (compare.user_average > compare.national_target) {
            userColor = 'var(--error-color)'; // Red
        } else if (compare.user_average > compare.global_target) {
            userColor = 'hsl(45, 90%, 50%)'; // Yellow/Orange
        }

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="bar-chart">
                <!-- User Bar -->
                <rect x="${xUser}" y="${yUser}" width="${barWidth}" height="${getBarHeight(compare.user_average)}" fill="${userColor}" rx="4" />
                <text x="${xUser + barWidth/2}" y="${yUser - 8}" fill="var(--text-primary)" font-size="10" font-weight="600" text-anchor="middle">${compare.user_average.toFixed(0)}</text>
                
                <!-- National Target Bar -->
                <rect x="${xNational}" y="${yNational}" width="${barWidth}" height="${getBarHeight(compare.national_target)}" fill="var(--chart-bar-2)" rx="4" />
                <text x="${xNational + barWidth/2}" y="${yNational - 8}" fill="var(--text-primary)" font-size="10" font-weight="600" text-anchor="middle">${compare.national_target.toFixed(0)}</text>
                
                <!-- Global Target Bar -->
                <rect x="${xGlobal}" y="${yGlobal}" width="${barWidth}" height="${getBarHeight(compare.global_target)}" fill="var(--chart-bar-1)" rx="4" />
                <text x="${xGlobal + barWidth/2}" y="${yGlobal - 8}" fill="var(--text-primary)" font-size="10" font-weight="600" text-anchor="middle">${compare.global_target.toFixed(0)}</text>

                <!-- X Axis Labels -->
                <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight}" y2="${height - paddingBottom}" stroke="var(--border-color)" />
                
                <text x="${xUser + barWidth/2}" y="${height - 20}" fill="var(--text-secondary)" font-size="9" text-anchor="middle" font-weight="500">You</text>
                <text x="${xNational + barWidth/2}" y="${height - 20}" fill="var(--text-secondary)" font-size="9" text-anchor="middle" font-weight="500">National</text>
                <text x="${xGlobal + barWidth/2}" y="${height - 20}" fill="var(--text-secondary)" font-size="9" text-anchor="middle" font-weight="500">Global Target</text>
                
                <text x="${xUser + barWidth/2}" y="${height - 8}" fill="var(--text-secondary)" font-size="8" text-anchor="middle">(Average)</text>
                <text x="${xNational + barWidth/2}" y="${height - 8}" fill="var(--text-secondary)" font-size="8" text-anchor="middle">(Target)</text>
                <text x="${xGlobal + barWidth/2}" y="${height - 8}" fill="var(--text-secondary)" font-size="8" text-anchor="middle">(Target)</text>
            </svg>
            <div style="margin-top: 15px; text-align: center;">
                <span class="meta-tag" style="font-weight: 600; color: white; background-color: ${userColor}; border: none;">
                    Status: ${compare.status}
                </span>
            </div>
        `;
    },

    // 2. Footprint Calculator Wizard View (Accessible focus-trapping inside active views)
    renderTracker(state, container) {
        if (!state.token) {
            window.location.hash = '#/login';
            return;
        }

        container.innerHTML = `
            <div class="glass-card wizard-box" id="wizard-calculator-container" aria-modal="true" role="dialog" aria-labelledby="wizard-title">
                <h1 id="wizard-title" class="page-title" style="font-size: 1.8rem; margin-bottom: 5px;">Footprint Calculator</h1>
                <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem;">Estimate your monthly carbon footprint by providing simple everyday estimates.</p>
                
                <div class="wizard-steps-header" aria-hidden="true">
                    <div class="wizard-progress-bar" id="wizard-progress"></div>
                    <div class="wizard-step-node active" id="node-1">1</div>
                    <div class="wizard-step-node" id="node-2">2</div>
                    <div class="wizard-step-node" id="node-3">3</div>
                    <div class="wizard-step-node" id="node-4">4</div>
                    <div class="wizard-step-node" id="node-5">5</div>
                </div>

                <div id="wizard-error-banner" class="alert-banner alert-danger" style="display: none;"></div>

                <form id="footprint-wizard-form" novalidate>
                    <!-- STEP 1: Transportation -->
                    <div class="wizard-step-content active" id="step-1" data-step="1">
                        <h2 style="font-size: 1.25rem; margin-bottom: 10px;">Step 1: Transportation</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">How do you travel on a monthly basis?</p>
                        
                        <div class="form-group">
                            <label for="input-drive-dist">Private Car Travel (km / month)</label>
                            <input type="number" id="input-drive-dist" class="form-input" min="0" value="0" placeholder="e.g. 300">
                        </div>
                        <div class="form-group">
                            <label for="input-fuel-type">Primary Vehicle Fuel Type</label>
                            <select id="input-fuel-type" class="form-input">
                                <option value="gasoline">Petrol / Gasoline</option>
                                <option value="diesel">Diesel</option>
                                <option value="electric">Electric Vehicle (EV)</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="input-flight-hours">Air Travel (Flight hours / month)</label>
                            <input type="number" id="input-flight-hours" class="form-input" min="0" value="0" placeholder="e.g. 5">
                        </div>
                    </div>

                    <!-- STEP 2: Energy -->
                    <div class="wizard-step-content" id="step-2" data-step="2">
                        <h2 style="font-size: 1.25rem; margin-bottom: 10px;">Step 2: Energy & Power</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">What is your household energy consumption?</p>
                        
                        <div class="form-group">
                            <label for="input-electric-kwh">Electricity Usage (kWh / month)</label>
                            <input type="number" id="input-electric-kwh" class="form-input" min="0" value="0" placeholder="e.g. 150">
                        </div>
                        <div class="form-group">
                            <label for="input-gas-therms">Natural Gas (Therms / month)</label>
                            <input type="number" id="input-gas-therms" class="form-input" min="0" value="0" placeholder="e.g. 10">
                        </div>
                    </div>

                    <!-- STEP 3: Waste -->
                    <div class="wizard-step-content" id="step-3" data-step="3">
                        <h2 style="font-size: 1.25rem; margin-bottom: 10px;">Step 3: Waste Management</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">How much non-recyclable waste does your home dispose?</p>
                        
                        <div class="form-group">
                            <label for="input-trash-bags">Trash Disposed (Standard bags / week)</label>
                            <input type="number" id="input-trash-bags" class="form-input" min="0" value="0" placeholder="e.g. 3">
                        </div>
                    </div>

                    <!-- STEP 4: Diet -->
                    <div class="wizard-step-content" id="step-4" data-step="4">
                        <h2 style="font-size: 1.25rem; margin-bottom: 10px;">Step 4: Nutrition & Diet Choice</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">Select the dietary profile that fits you best.</p>
                        
                        <div class="form-group">
                            <label for="input-diet-type">Diet Category</label>
                            <select id="input-diet-type" class="form-input">
                                <option value="heavy-meat">Heavy Meat Eater (Meat in most meals)</option>
                                <option value="medium-meat">Moderate Meat Eater (Occasionally eats meat)</option>
                                <option value="vegetarian">Vegetarian (No meat, consumes dairy/eggs)</option>
                                <option value="vegan">Vegan (Completely plant-based)</option>
                            </select>
                        </div>
                    </div>

                    <!-- STEP 5: Review & Submit -->
                    <div class="wizard-step-content" id="step-5" data-step="5">
                        <h2 style="font-size: 1.25rem; margin-bottom: 10px;">Step 5: Review Estimates</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">Double check your computed footprint before submission.</p>
                        
                        <div id="calculator-summary-box" style="background-color: var(--bg-primary); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 20px;">
                            <!-- Calculated outputs filled by JS -->
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="wizard-actions">
                        <button type="button" id="wizard-prev-btn" class="btn btn-secondary" disabled>Previous</button>
                        <button type="button" id="wizard-next-btn" class="btn btn-primary">Next</button>
                    </div>
                </form>
            </div>
        `;

        const wizard = container.querySelector('#wizard-calculator-container');
        const form = container.querySelector('#footprint-wizard-form');
        const prevBtn = container.querySelector('#wizard-prev-btn');
        const nextBtn = container.querySelector('#wizard-next-btn');
        const progress = container.querySelector('#wizard-progress');
        const errorBanner = container.querySelector('#wizard-error-banner');
        
        let currentStep = 1;
        const totalSteps = 5;

        // Perform Focus Trap on initialize
        this.trapFocus(wizard);

        // Helper calculations (formulas in kg CO2)
        const calculateFootprint = () => {
            // Step 1 values
            const carDist = parseFloat(form.querySelector('#input-drive-dist').value) || 0.0;
            const fuelType = form.querySelector('#input-fuel-type').value;
            const flightHrs = parseFloat(form.querySelector('#input-flight-hours').value) || 0.0;

            // Step 2 values
            const kwh = parseFloat(form.querySelector('#input-electric-kwh').value) || 0.0;
            const therms = parseFloat(form.querySelector('#input-gas-therms').value) || 0.0;

            // Step 3 values
            const trashBags = parseFloat(form.querySelector('#input-trash-bags').value) || 0.0;

            // Step 4 values
            const diet = form.querySelector('#input-diet-type').value;

            // Formulas:
            // Transport:
            let fuelFactor = 0.18; // gasoline
            if (fuelType === 'diesel') fuelFactor = 0.20;
            else if (fuelType === 'electric') fuelFactor = 0.05;
            else if (fuelType === 'hybrid') fuelFactor = 0.11;
            
            const transportEmissions = (carDist * fuelFactor) + (flightHrs * 110.0);

            // Energy:
            const energyEmissions = (kwh * 0.38) + (therms * 5.3);

            // Waste: weekly bags -> monthly bags (~4.33 weeks per month)
            const wasteEmissions = trashBags * 4.33 * 2.3;

            // Diet:
            let dietEmissions = 200.0; // moderate meat
            if (diet === 'heavy-meat') dietEmissions = 340.0;
            else if (diet === 'vegetarian') dietEmissions = 95.0;
            else if (diet === 'vegan') dietEmissions = 45.0;

            const total = transportEmissions + energyEmissions + wasteEmissions + dietEmissions;

            return {
                transportation: parseFloat(transportEmissions.toFixed(1)),
                energy: parseFloat(energyEmissions.toFixed(1)),
                waste: parseFloat(wasteEmissions.toFixed(1)),
                diet: parseFloat(dietEmissions.toFixed(1)),
                total: parseFloat(total.toFixed(1))
            };
        };

        const updateStepView = () => {
            // Hide all steps
            form.querySelectorAll('.wizard-step-content').forEach(s => s.classList.remove('active'));
            // Show current step
            form.querySelector(`#step-${currentStep}`).classList.add('active');

            // Update Progress Nodes
            for (let i = 1; i <= totalSteps; i++) {
                const node = wizard.querySelector(`#node-${i}`);
                node.className = 'wizard-step-node';
                if (i < currentStep) node.classList.add('completed');
                else if (i === currentStep) node.classList.add('active');
            }

            // Update progress bar width
            const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 90; // max width 90%
            progress.style.width = `${progressPercent}%`;

            // Update buttons
            prevBtn.disabled = currentStep === 1;
            if (currentStep === totalSteps) {
                nextBtn.textContent = 'Submit';
                // Render summary
                const sums = calculateFootprint();
                wizard.querySelector('#calculator-summary-box').innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>🚗 Transportation:</span>
                        <strong>${sums.transportation} kg CO₂</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>⚡ Energy & Power:</span>
                        <strong>${sums.energy} kg CO₂</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>🗑️ Waste Management:</span>
                        <strong>${sums.waste} kg CO₂</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>🥗 Dietary Impact:</span>
                        <strong>${sums.diet} kg CO₂</strong>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-between; font-size: 1.15rem; color: var(--accent-color);">
                        <span>Total Monthly Footprint:</span>
                        <strong>${sums.total} kg CO₂</strong>
                    </div>
                `;
            } else {
                nextBtn.textContent = 'Next';
            }

            // Re-apply focus trap on step switch to focus first element in new step
            this.trapFocus(wizard);
        };

        const validateStep = (step) => {
            errorBanner.style.display = 'none';
            if (step === 1) {
                const drive = parseFloat(form.querySelector('#input-drive-dist').value);
                const flights = parseFloat(form.querySelector('#input-flight-hours').value);
                if (isNaN(drive) || drive < 0 || isNaN(flights) || flights < 0) {
                    throw new Error("Transportation inputs must be non-negative numbers.");
                }
            } else if (step === 2) {
                const kwh = parseFloat(form.querySelector('#input-electric-kwh').value);
                const therms = parseFloat(form.querySelector('#input-gas-therms').value);
                if (isNaN(kwh) || kwh < 0 || isNaN(therms) || therms < 0) {
                    throw new Error("Energy inputs must be non-negative numbers.");
                }
            } else if (step === 3) {
                const bags = parseFloat(form.querySelector('#input-trash-bags').value);
                if (isNaN(bags) || bags < 0) {
                    throw new Error("Waste inputs must be a non-negative number.");
                }
            }
            return true;
        };

        nextBtn.addEventListener('click', async () => {
            try {
                validateStep(currentStep);
                
                if (currentStep < totalSteps) {
                    currentStep++;
                    updateStepView();
                } else {
                    // Final Submission
                    nextBtn.disabled = true;
                    const sums = calculateFootprint();
                    
                    try {
                        const res = await window.EcoApi.createEntry(
                            sums.transportation,
                            sums.energy,
                            sums.waste,
                            sums.diet
                        );
                        
                        // Show success modal or redirect
                        wizard.innerHTML = `
                            <div style="text-align: center; padding: 20px;">
                                <span style="font-size: 3.5rem;">🌱</span>
                                <h2 style="margin-top: 15px; font-size: 1.6rem;">Footprint Logged!</h2>
                                <p style="color: var(--text-secondary); margin-top: 10px; margin-bottom: 25px;">
                                    Your carbon footprint entry of <strong>${sums.total} kg CO₂</strong> has been recorded. Let's look at recommendations or try a challenge!
                                </p>
                                <div style="display: flex; gap: 15px; justify-content: center;">
                                    <a href="#/dashboard" class="btn btn-primary">Go to Dashboard</a>
                                    <a href="#/recommendations" class="btn btn-secondary">Get AI Recommendations</a>
                                </div>
                            </div>
                        `;
                    } catch (apiErr) {
                        nextBtn.disabled = false;
                        errorBanner.textContent = apiErr.message || 'Failed to save footprint entry.';
                        errorBanner.style.display = 'flex';
                    }
                }
            } catch (err) {
                errorBanner.textContent = err.message;
                errorBanner.style.display = 'flex';
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepView();
            }
        });
    },

    // 3. AI Insights/Recommendations View
    renderRecommendations(state, container) {
        if (!state.token) {
            window.location.hash = '#/login';
            return;
        }

        container.innerHTML = `
            <h1 class="page-title">AI Insights</h1>
            <p class="page-subtitle">Personalized carbon mitigation strategies dynamically optimized by Google Gemini API.</p>
            
            <div id="recommendations-content">
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Analyzing your footprints & loading AI recommendations...</p>
                </div>
            </div>
        `;

        const content = container.querySelector('#recommendations-content');

        // Fetch Recommendations
        window.EcoApi.getRecommendations()
            .then(res => {
                state.recommendations = res; // Sync state
                
                const isAI = res.source === 'Gemini AI';
                const sourceClass = isAI ? 'source-ai' : 'source-fallback';
                
                let cardsHTML = "";
                res.recommendations.forEach(tip => {
                    cardsHTML += `
                        <div class="rec-card impact-${tip.impact}">
                            <div class="rec-header-row">
                                <h3 style="font-size: 1.15rem; font-weight: 600;">${tip.title}</h3>
                                <span class="rec-impact-badge ${tip.impact}">Impact: ${tip.impact}</span>
                            </div>
                            <p style="color: var(--text-secondary); font-size: 0.95rem;">${tip.description}</p>
                        </div>
                    `;
                });

                content.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <span class="rec-source-pill ${sourceClass}">
                            Engine: ${res.source}
                        </span>
                        <p style="margin-bottom: 25px; color: var(--text-primary);">
                            Based on your highest carbon footprint source (<strong style="text-transform: capitalize; color: var(--accent-color);">${res.category}</strong>), our engine recommends:
                        </p>
                    </div>
                    <div class="rec-cards-container">
                        ${cardsHTML}
                    </div>
                `;
            })
            .catch(err => {
                content.innerHTML = `
                    <div class="alert-banner alert-danger">
                        ${err.message || 'Error occurred while loading recommendations.'}
                    </div>
                `;
            });
    },

    // 4. Gamified Eco Challenges View
    renderChallenges(state, container) {
        if (!state.token) {
            window.location.hash = '#/login';
            return;
        }

        container.innerHTML = `
            <h1 class="page-title">Eco Challenges</h1>
            <p class="page-subtitle">Complete carbon-reduction tasks, submit audit proofs, and accumulate points.</p>
            
            <div id="challenges-content">
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Fetching challenges...</p>
                </div>
            </div>
        `;

        const content = container.querySelector('#challenges-content');
        this.loadChallengesList(state, content);
    },

    async loadChallengesList(state, wrapper) {
        try {
            const data = await window.EcoApi.getChallenges();
            state.challenges = data; // Sync state
            
            const buildCards = (list, type) => {
                if (list.length === 0) {
                    return `<p style="color: var(--text-secondary); font-size: 0.9rem; font-style: italic;">No challenges in this section.</p>`;
                }
                
                return list.map(c => `
                    <div class="challenge-card" data-id="${c.id}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <span class="category-badge badge-${c.category}">${c.category}</span>
                            <span class="challenge-points">+${c.points_reward} pts</span>
                        </div>
                        <h3 class="challenge-card-title">${c.title}</h3>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 15px;">${c.description}</p>
                        ${type === 'available' ? `
                            <button class="btn btn-secondary btn-sm accept-challenge-btn" style="padding: 6px 12px; font-size: 0.8rem; width: 100%;">Accept Challenge</button>
                        ` : ''}
                        ${type === 'active' ? `
                            <button class="btn btn-primary btn-sm submit-proof-btn" style="padding: 6px 12px; font-size: 0.8rem; width: 100%;">Submit Audit Proof</button>
                        ` : ''}
                        ${type === 'completed' ? `
                            <div style="background-color: var(--success-soft); color: var(--accent-color); border: 1px solid hsla(var(--hue-emerald), 70%, 45%, 0.2); border-radius: 4px; padding: 6px; font-size: 0.8rem; font-weight: 600; text-align: center;">
                                Completed ✓
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            };

            wrapper.innerHTML = `
                <div class="challenges-layout">
                    <div>
                        <h2 class="challenges-column-title">🌱 Active & Available</h2>
                        <div class="challenge-list">
                            <h3 style="font-size: 1rem; color: var(--text-secondary); margin-top: 10px;">Active Challenges</h3>
                            ${buildCards(data.active, 'active')}
                            <h3 style="font-size: 1rem; color: var(--text-secondary); margin-top: 20px;">Available Challenges</h3>
                            ${buildCards(data.available, 'available')}
                        </div>
                    </div>
                    <div>
                        <h2 class="challenges-column-title">🏆 Completed Badges</h2>
                        <div class="challenge-list">
                            ${buildCards(data.completed, 'completed')}
                        </div>
                    </div>
                </div>
            `;

            // Bind Actions
            wrapper.querySelectorAll('.accept-challenge-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = btn.closest('.challenge-card').getAttribute('data-id');
                    try {
                        await window.EcoApi.acceptChallenge(id);
                        this.loadChallengesList(state, wrapper);
                    } catch (err) {
                        alert(err.message || 'Failed to accept challenge.');
                    }
                });
            });

            wrapper.querySelectorAll('.submit-proof-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = btn.closest('.challenge-card');
                    const id = card.getAttribute('data-id');
                    const title = card.querySelector('.challenge-card-title').textContent;
                    this.showProofModal(state, id, title, wrapper);
                });
            });

        } catch (err) {
            wrapper.innerHTML = `<div class="alert-banner alert-danger">${err.message || 'Error fetching challenges.'}</div>`;
        }
    },

    // Show Proof Modal (with focus trapping & audit check)
    showProofModal(state, challengeId, challengeTitle, challengeWrapper) {
        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-header">
                    <h2 id="modal-title" style="font-size: 1.3rem;">Audit Challenge Completion</h2>
                    <button class="modal-close-btn" aria-label="Close modal">&times;</button>
                </div>
                <div id="modal-error-banner" class="alert-banner alert-danger" style="display: none;"></div>
                <form id="proof-submission-form">
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">
                        Please provide written proof demonstrating that you completed <strong>${challengeTitle}</strong>. Your statement will be evaluated against auditing rules.
                    </p>
                    <div class="form-group">
                        <label for="modal-proof-text">Written Description / Evidence</label>
                        <textarea id="modal-proof-text" class="form-input" rows="4" placeholder="Describe what you did, e.g. 'I installed three new LED light bulbs in my bedroom last Tuesday.'" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Submit & Audit</button>
                </form>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        this.trapFocus(modalOverlay);

        const closeBtn = modalOverlay.querySelector('.modal-close-btn');
        const form = modalOverlay.querySelector('#proof-submission-form');
        const errorBanner = modalOverlay.querySelector('#modal-error-banner');
        
        const closeModal = () => {
            document.body.removeChild(modalOverlay);
            // Return focus to challenges page context
            const activeSubmits = challengeWrapper.querySelectorAll('.submit-proof-btn');
            if (activeSubmits.length > 0) activeSubmits[0].focus();
        };

        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorBanner.style.display = 'none';
            const proofText = modalOverlay.querySelector('#modal-proof-text').value.strip ? modalOverlay.querySelector('#modal-proof-text').value.strip() : modalOverlay.querySelector('#modal-proof-text').value.trim();

            if (!proofText) {
                errorBanner.textContent = 'Proof description cannot be blank.';
                errorBanner.style.display = 'flex';
                return;
            }

            try {
                const res = await window.EcoApi.submitChallengeProof(challengeId, proofText);
                
                // Update points in global state
                state.updatePoints(res.total_points);
                
                // Close modal
                document.body.removeChild(modalOverlay);
                
                // Refresh list
                this.loadChallengesList(state, challengeWrapper);
            } catch (err) {
                errorBanner.textContent = err.message || 'Audit failed. Check description rules.';
                errorBanner.style.display = 'flex';
            }
        });
    },

    // 5. User Sign In (Login) View
    renderLogin(state, container) {
        container.innerHTML = `
            <div class="glass-card auth-grid">
                <h1 style="text-align: center; margin-bottom: 5px; font-size: 1.8rem;">Welcome Back</h1>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 25px; font-size: 0.9rem;">Sign in to your GreenTrack account to log emissions</p>
                
                <div id="auth-error-banner" class="alert-banner alert-danger" style="display: none;"></div>

                <form id="login-form" novalidate>
                    <div class="form-group">
                        <label for="login-email">Email Address</label>
                        <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Sign In</button>
                    
                    <div style="text-align: center; margin-top: 15px; margin-bottom: 10px; font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
                        <span>OR</span>
                        <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
                    </div>

                    <button type="button" id="demo-mode-btn" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--accent-color); color: var(--accent-color); background: var(--accent-soft);">
                        ⚡ Explore in Demo Mode
                    </button>
                </form>

                <p class="auth-footer-text" style="margin-top: 20px;">
                    Don't have an account? <a href="#/register">Create Account</a>
                </p>
            </div>
        `;

        const form = container.querySelector('#login-form');
        const errorBanner = container.querySelector('#auth-error-banner');
        const submitBtn = container.querySelector('#login-submit-btn');
        const demoBtn = container.querySelector('#demo-mode-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorBanner.style.display = 'none';
            submitBtn.disabled = true;

            const email = form.querySelector('#login-email').value.trim();
            const password = form.querySelector('#login-password').value;

            if (!email || !password) {
                errorBanner.textContent = 'All fields are required.';
                errorBanner.style.display = 'flex';
                submitBtn.disabled = false;
                return;
            }

            try {
                const res = await window.EcoApi.login(email, password);
                state.setAuth(res.user, res.token);
                window.location.hash = '#/dashboard';
            } catch (err) {
                errorBanner.textContent = err.message || 'Login failed.';
                errorBanner.style.display = 'flex';
                submitBtn.disabled = false;
            }
        });

        demoBtn.addEventListener('click', async () => {
            errorBanner.style.display = 'none';
            demoBtn.disabled = true;
            try {
                const res = await window.EcoApi.demoLogin();
                state.setAuth(res.user, res.token);
                window.location.hash = '#/dashboard';
            } catch (err) {
                errorBanner.textContent = err.message || 'Demo mode initialization failed.';
                errorBanner.style.display = 'flex';
                demoBtn.disabled = false;
            }
        });
    },

    // 6. User Registration View
    renderRegister(state, container) {
        container.innerHTML = `
            <div class="glass-card auth-grid">
                <h1 style="text-align: center; margin-bottom: 5px; font-size: 1.8rem;">Create Account</h1>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 25px; font-size: 0.9rem;">Join GreenTrack AI and begin your carbon footprint tracking</p>
                
                <div id="auth-error-banner" class="alert-banner alert-danger" style="display: none;"></div>

                <form id="register-form" novalidate>
                    <div class="form-group">
                        <label for="reg-username">Username</label>
                        <input type="text" id="reg-username" class="form-input" placeholder="green_hero" required>
                    </div>
                    <div class="form-group">
                        <label for="reg-email">Email Address</label>
                        <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="reg-password">Password</label>
                        <input type="password" id="reg-password" class="form-input" placeholder="At least 6 characters" required>
                    </div>
                    <button type="submit" id="reg-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Register</button>
                </form>

                <p class="auth-footer-text">
                    Already have an account? <a href="#/login">Sign In</a>
                </p>
            </div>
        `;

        const form = container.querySelector('#register-form');
        const errorBanner = container.querySelector('#auth-error-banner');
        const submitBtn = container.querySelector('#reg-submit-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorBanner.style.display = 'none';
            submitBtn.disabled = true;

            const username = form.querySelector('#reg-username').value.trim();
            const email = form.querySelector('#reg-email').value.trim();
            const password = form.querySelector('#reg-password').value;

            if (!username || !email || !password) {
                errorBanner.textContent = 'All fields are required.';
                errorBanner.style.display = 'flex';
                submitBtn.disabled = false;
                return;
            }

            if (password.length < 6) {
                errorBanner.textContent = 'Password must be at least 6 characters long.';
                errorBanner.style.display = 'flex';
                submitBtn.disabled = false;
                return;
            }

            try {
                const res = await window.EcoApi.register(username, email, password);
                state.setAuth(res.user, res.token);
                window.location.hash = '#/dashboard';
            } catch (err) {
                errorBanner.textContent = err.message || 'Registration failed.';
                errorBanner.style.display = 'flex';
                submitBtn.disabled = false;
            }
        });
    },

    renderOffsets(state, container) {
        if (!state.token) {
            window.location.hash = '#/login';
            return;
        }

        container.innerHTML = `
            <h1 class="page-title">Carbon Offset Projects</h1>
            <p class="page-subtitle">Plant native trees, support solar energy, or clean up oceans using your Green Points.</p>
            
            <div id="offsets-content">
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading projects...</p>
                </div>
            </div>
        `;

        const content = container.querySelector('#offsets-content');
        this.loadOffsetsView(state, content);
    },

    async loadOffsetsView(state, wrapper) {
        try {
            const data = await window.EcoApi.getOffsets();
            state.offsets = data.transactions;
            state.offsetProjects = data.projects;
            state.totalOffset = data.total_offset;
            
            let projectsHTML = "";
            state.offsetProjects.forEach(proj => {
                const canAfford = state.user.points >= proj.points_cost;
                const progressPct = Math.min(100, (state.user.points / proj.points_cost) * 100);
                
                projectsHTML += `
                    <div class="glass-card challenge-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 15px;">
                        <div>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                <span style="font-size: 2.2rem;">${proj.icon}</span>
                                <span class="category-badge" style="background-color: var(--accent-soft); color: var(--accent-color); font-weight: 700;">-${proj.points_cost} pts</span>
                            </div>
                            <h3 class="challenge-card-title">${proj.title}</h3>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px; margin-bottom: 15px;">${proj.description}</p>
                            <div style="font-size: 0.85rem; font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: var(--text-secondary);">Carbon Offset:</span>
                                <span style="color: var(--accent-color); font-weight: 700;">+${proj.co2_offset} kg CO₂</span>
                            </div>
                            <!-- Point Progress Bar -->
                            <div style="height: 6px; width: 100%; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-top: 10px;">
                                <div style="height: 100%; width: ${progressPct}%; background: var(--accent-color); border-radius: 3px;"></div>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary fund-project-btn" data-id="${proj.id}" ${canAfford ? '' : 'disabled'} style="width: 100%;">
                            ${canAfford ? 'Fund Offset Project' : `Earn ${proj.points_cost - state.user.points} more pts`}
                        </button>
                    </div>
                `;
            });
            
            let transactionsHTML = "";
            if (state.offsets.length === 0) {
                transactionsHTML = `
                    <div style="text-align: center; padding: 45px 20px; color: var(--text-secondary); font-style: italic;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 10px;">🌱</span>
                        No offset transactions logged yet. Complete challenges to earn points and fund carbon offsets!
                    </div>
                `;
            } else {
                transactionsHTML = `
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">
                                    <th style="padding: 10px 5px;">Project</th>
                                    <th style="padding: 10px 5px; text-align: right;">Spent</th>
                                    <th style="padding: 10px 5px; text-align: right;">Offset</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.offsets.map(t => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                        <td style="padding: 10px 5px; font-weight: 500;">${t.project_name}</td>
                                        <td style="padding: 10px 5px; text-align: right; color: var(--error-color); font-weight: 600;">-${t.points_spent} pts</td>
                                        <td style="padding: 10px 5px; text-align: right; color: var(--accent-color); font-weight: 600;">+${t.co2_offset} kg</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            wrapper.innerHTML = `
                <div class="stat-cards-row" style="margin-bottom: 40px;">
                    <div class="stat-card">
                        <span class="stat-label">Total Carbon Offsetted</span>
                        <span class="stat-value" style="color: var(--accent-color);">${state.totalOffset} kg CO₂</span>
                        <span class="stat-trend trend-down">🌱 Lifetime Impact</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Available Green Points</span>
                        <span class="stat-value" style="color: #ffd700;">${state.user.points} pts</span>
                        <span class="stat-trend trend-up">🌟 Complete challenges for more</span>
                    </div>
                </div>

                <div class="challenges-layout">
                    <div>
                        <h2 class="challenges-column-title">🌳 Available Nature Projects</h2>
                        <div class="challenge-list" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); display: grid; gap: 20px;">
                            ${projectsHTML}
                        </div>
                    </div>
                    <div>
                        <h2 class="challenges-column-title">📜 Offset History Log</h2>
                        <div class="glass-card" style="padding: 20px;">
                            ${transactionsHTML}
                        </div>
                    </div>
                </div>
            `;

            // Bind project fund buttons
            wrapper.querySelectorAll('.fund-project-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const projectId = e.currentTarget.getAttribute('data-id');
                    e.currentTarget.disabled = true;
                    e.currentTarget.textContent = 'Funding project...';
                    
                    try {
                        const res = await window.EcoApi.purchaseOffset(projectId);
                        
                        // Update local state points and refresh view
                        state.updatePoints(res.user.points);
                        
                        // Show success alert & reload
                        alert(res.message);
                        this.loadOffsetsView(state, wrapper);
                    } catch (err) {
                        alert(err.message || 'Failed to fund project.');
                        btn.disabled = false;
                        btn.textContent = 'Fund Offset Project';
                    }
                });
            });

        } catch (err) {
            wrapper.innerHTML = `
                <div class="alert-banner alert-danger">
                    ${err.message || 'Error occurred while loading carbon offsets.'}
                </div>
            `;
        }
    }
};


window.EcoComponents = EcoComponents;
