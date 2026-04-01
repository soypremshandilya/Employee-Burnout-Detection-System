/**
 * Task Level Employee Burnout Risk Detection — Frontend Logic
 * Handles form interaction, API calls, and dynamic result rendering.
 */

(() => {
    "use strict";

    // ── DOM References ──────────────────────────────────────────────────
    const form          = document.getElementById("burnoutForm");
    const analyzeBtn    = document.getElementById("analyzeBtn");
    const resetBtn      = document.getElementById("resetBtn");
    const resultsSection = document.getElementById("resultsSection");
    const inputSection  = document.getElementById("inputSection");
    const infoBanner    = document.getElementById("infoBanner");
    const newAnalysisBtn = document.getElementById("newAnalysisBtn");
    const detailsToggle = document.getElementById("detailsToggle");
    const detailsContent = document.getElementById("detailsContent");

    // Result elements
    const gaugeArc      = document.getElementById("gaugeArc");
    const gaugeNeedle   = document.getElementById("gaugeNeedle");
    const gaugeScore    = document.getElementById("gaugeScore");
    const gaugeLabel    = document.getElementById("gaugeLabel");
    const riskBadge     = document.getElementById("riskBadge");
    const riskEmoji     = document.getElementById("riskEmoji");
    const riskLevel     = document.getElementById("riskLevel");
    const factorsList   = document.getElementById("factorsList");
    const recsGrid      = document.getElementById("recsGrid");
    const baseValue     = document.getElementById("baseValue");

    // Feature input pairs (range ↔ number sync)
    const inputPairs = [
        { range: "tasksAssignedRange",      num: "tasksAssigned" },
        { range: "tasksCompletedRange",     num: "tasksCompleted" },
        { range: "contextSwitchesRange",    num: "contextSwitches" },
        { range: "uninterruptedWorkRange",  num: "uninterruptedWork" },
        { range: "standardHoursRange",      num: "standardHours" },
        { range: "afterHoursRange",         num: "afterHours" },
        { range: "missedDeadlinesRange",    num: "missedDeadlines" },
    ];

    // ── Input Sync ──────────────────────────────────────────────────────
    inputPairs.forEach(({ range, num }) => {
        const rangeEl = document.getElementById(range);
        const numEl   = document.getElementById(num);

        rangeEl.addEventListener("input", () => {
            numEl.value = rangeEl.value;
        });

        numEl.addEventListener("input", () => {
            let val = parseFloat(numEl.value);
            if (!isNaN(val)) {
                val = Math.max(parseFloat(rangeEl.min), Math.min(parseFloat(rangeEl.max), val));
                rangeEl.value = val;
            }
        });
    });

    // ── Form Submit ─────────────────────────────────────────────────────
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await analyzeRisk();
    });

    // ── Reset Button ────────────────────────────────────────────────────
    resetBtn.addEventListener("click", () => {
        const defaults = [25, 20, 10, 60, 40, 100, 1];
        inputPairs.forEach(({ range, num }, i) => {
            document.getElementById(range).value = defaults[i];
            document.getElementById(num).value   = defaults[i];
        });
    });

    // ── New Analysis Button ─────────────────────────────────────────────
    newAnalysisBtn.addEventListener("click", () => {
        resultsSection.classList.add("hidden");
        inputSection.style.display = "";
        infoBanner.style.display = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // ── Technical Details Toggle ────────────────────────────────────────
    detailsToggle.addEventListener("click", () => {
        detailsContent.classList.toggle("hidden");
        detailsToggle.classList.toggle("open");
    });

    // ── Core: Analyze Risk ──────────────────────────────────────────────
    async function analyzeRisk() {
        // Collect form data
        const payload = {};
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            payload[key] = parseFloat(value);
        }

        // Loading state
        analyzeBtn.classList.add("loading");
        analyzeBtn.disabled = true;

        try {
            const response = await fetch("/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Server error");
            }

            const result = await response.json();
            renderResults(result);
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            analyzeBtn.classList.remove("loading");
            analyzeBtn.disabled = false;
        }
    }

    // ── Render Results ──────────────────────────────────────────────────
    function renderResults(data) {
        // Hide input section, show results
        inputSection.style.display = "none";
        infoBanner.style.display = "none";
        resultsSection.classList.remove("hidden");

        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });

        // ── Animate Gauge ───────────────────────────────────────────────
        animateGauge(data.risk_score, data.risk_color);

        // ── Risk Badge ──────────────────────────────────────────────────
        riskEmoji.textContent = data.risk_emoji;
        riskLevel.textContent = data.risk_level + " Risk";
        riskBadge.style.background = hexToRgba(data.risk_color, 0.12);
        riskBadge.style.border = `1px solid ${hexToRgba(data.risk_color, 0.3)}`;
        riskBadge.style.color = data.risk_color;

        // ── Contributing Factors ────────────────────────────────────────
        renderFactors(data.factors);

        // ── Recommendations ─────────────────────────────────────────────
        renderRecommendations(data.recommendations);

        // ── Base Value ──────────────────────────────────────────────────
        baseValue.textContent = data.base_value.toFixed(1) + " (avg risk across training data)";
    }

    // ── Gauge Animation ─────────────────────────────────────────────────
    function animateGauge(score, color) {
        const arcLength = 251.3; // Half-circle circumference for r=80
        const target = (score / 100) * arcLength;
        const targetAngle = -90 + (score / 100) * 180;

        // Animate score number
        animateCounter(gaugeScore, 0, Math.round(score), 1200);
        gaugeLabel.textContent = "out of 100";

        // Animate arc
        let start = null;
        const duration = 1200;

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = easeOutCubic(progress);

            const currentDash = eased * target;
            gaugeArc.setAttribute("stroke-dasharray", `${currentDash} ${arcLength}`);

            const currentAngle = -90 + eased * (score / 100) * 180;
            gaugeNeedle.setAttribute("transform", `rotate(${currentAngle}, 100, 100)`);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    // ── Animated Counter ────────────────────────────────────────────────
    function animateCounter(el, start, end, duration) {
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = easeOutCubic(progress);
            el.textContent = Math.round(start + (end - start) * eased);
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    // ── Render Factors ──────────────────────────────────────────────────
    function renderFactors(factors) {
        factorsList.innerHTML = "";
        const maxImpact = Math.max(...factors.map(f => Math.abs(f.impact)), 1);

        factors.forEach((factor, index) => {
            const isPositive = factor.impact > 0;
            const barWidth = (Math.abs(factor.impact) / maxImpact) * 100;
            const cls = isPositive ? "positive" : "negative";

            const item = document.createElement("div");
            item.className = "factor-item";
            item.style.animationDelay = `${index * 0.08}s`;

            item.innerHTML = `
                <div class="factor-info">
                    <div class="factor-name">${factor.label} <span style="color:var(--text-muted);font-weight:400;font-size:0.75rem">= ${factor.value}</span></div>
                    <div class="factor-bar-container">
                        <div class="factor-bar ${cls}" data-width="${barWidth}"></div>
                    </div>
                </div>
                <div class="factor-impact ${cls}">
                    ${isPositive ? "+" : ""}${factor.impact.toFixed(1)} pts
                    <span class="factor-direction">${factor.direction}</span>
                </div>
            `;

            factorsList.appendChild(item);

            // Animate bar width after a short delay
            setTimeout(() => {
                const bar = item.querySelector(".factor-bar");
                bar.style.width = barWidth + "%";
            }, 100 + index * 80);
        });
    }

    // ── Render Recommendations ──────────────────────────────────────────
    function renderRecommendations(recs) {
        recsGrid.innerHTML = "";

        recs.forEach((rec, index) => {
            const item = document.createElement("div");
            item.className = "rec-item";
            item.style.animationDelay = `${index * 0.1}s`;

            item.innerHTML = `
                <div class="rec-icon">${rec.icon}</div>
                <div>
                    <div class="rec-title">${rec.title}</div>
                    <div class="rec-desc">${rec.desc}</div>
                </div>
            `;

            recsGrid.appendChild(item);
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
})();
