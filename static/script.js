/**
 * Task Level Employee Burnout Risk Detection — Frontend Logic
 * Handles form interaction, file upload, API calls, and dynamic result rendering.
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

    // Tab elements
    const tabManual     = document.getElementById("tabManual");
    const tabUpload     = document.getElementById("tabUpload");

    // Upload elements
    const uploadSection  = document.getElementById("uploadSection");
    const uploadDropZone = document.getElementById("uploadDropZone");
    const fileInput      = document.getElementById("fileInput");
    const uploadFileInfo = document.getElementById("uploadFileInfo");
    const uploadFileName = document.getElementById("uploadFileName");
    const uploadFileSize = document.getElementById("uploadFileSize");
    const fileRemoveBtn  = document.getElementById("fileRemoveBtn");
    const uploadBtn      = document.getElementById("uploadBtn");
    const uploadWarnings = document.getElementById("uploadWarnings");
    const warningList    = document.getElementById("warningList");
    const batchResults   = document.getElementById("batchResults");
    const totalEmployees = document.getElementById("totalEmployees");
    const batchSummary   = document.getElementById("batchSummary");
    const batchTableBody = document.getElementById("batchTableBody");
    const employeeModal  = document.getElementById("employeeModal");
    const modalOverlay   = document.getElementById("modalOverlay");
    const modalClose     = document.getElementById("modalClose");
    const modalBody      = document.getElementById("modalBody");

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

    // State
    let selectedFile = null;
    let currentTab = "manual";
    let batchData = null;

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

    // ── Tab Switching ───────────────────────────────────────────────────
    tabManual.addEventListener("click", () => switchTab("manual"));
    tabUpload.addEventListener("click", () => switchTab("upload"));

    function switchTab(tab) {
        currentTab = tab;
        tabManual.classList.toggle("active", tab === "manual");
        tabUpload.classList.toggle("active", tab === "upload");

        if (tab === "manual") {
            infoBanner.style.display = "";
            inputSection.style.display = "";
            uploadSection.classList.add("hidden");
            // Hide results if they were from manual
            if (resultsSection && !resultsSection.classList.contains("hidden")) {
                // Keep showing manual results
            }
        } else {
            infoBanner.style.display = "none";
            inputSection.style.display = "none";
            resultsSection.classList.add("hidden");
            uploadSection.classList.remove("hidden");
        }
    }

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

    // ══════════════════════════════════════════════════════════════════════
    // ── Upload Section Logic ────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════

    // Drag and drop
    uploadDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadDropZone.classList.add("drag-over");
    });

    uploadDropZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        uploadDropZone.classList.remove("drag-over");
    });

    uploadDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadDropZone.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            handleFileSelect(fileInput.files[0]);
        }
    });

    // Remove file
    fileRemoveBtn.addEventListener("click", () => {
        clearFileSelection();
    });

    // Upload button
    uploadBtn.addEventListener("click", async () => {
        if (!selectedFile) return;
        await uploadFile();
    });

    // Modal close
    modalClose.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", closeModal);

    function handleFileSelect(file) {
        const validTypes = [".csv", ".xlsx", ".xls"];
        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!validTypes.includes(ext)) {
            alert("Please select a CSV or Excel file.");
            return;
        }

        selectedFile = file;
        uploadDropZone.classList.add("hidden");
        uploadFileInfo.classList.remove("hidden");
        uploadFileName.textContent = file.name;
        uploadFileSize.textContent = formatFileSize(file.size);
        uploadBtn.disabled = false;

        // Reset previous results
        batchResults.classList.add("hidden");
        uploadWarnings.classList.add("hidden");
    }

    function clearFileSelection() {
        selectedFile = null;
        fileInput.value = "";
        uploadDropZone.classList.remove("hidden");
        uploadFileInfo.classList.add("hidden");
        uploadBtn.disabled = true;
        batchResults.classList.add("hidden");
        uploadWarnings.classList.add("hidden");
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
    }

    // ── Upload File and Get Predictions ─────────────────────────────────
    async function uploadFile() {
        uploadBtn.classList.add("loading");
        uploadBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch("/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Upload failed");
            }

            batchData = result;
            renderBatchResults(result);
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            uploadBtn.classList.remove("loading");
            uploadBtn.disabled = false;
        }
    }

    // ── Render Batch Results ────────────────────────────────────────────
    function renderBatchResults(data) {
        // Show warnings if any
        if (data.warnings && data.warnings.length > 0) {
            uploadWarnings.classList.remove("hidden");
            warningList.innerHTML = "";
            data.warnings.forEach(w => {
                const li = document.createElement("li");
                li.textContent = w;
                warningList.appendChild(li);
            });
        } else {
            uploadWarnings.classList.add("hidden");
        }

        // Show results
        batchResults.classList.remove("hidden");
        totalEmployees.textContent = data.total_employees;

        // Summary cards
        const levels = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
        data.results.forEach(r => { levels[r.risk_level]++; });

        batchSummary.innerHTML = `
            <div class="summary-card summary-low">
                <div class="summary-count">${levels.Low}</div>
                <div class="summary-label">✅ Low Risk</div>
            </div>
            <div class="summary-card summary-moderate">
                <div class="summary-count">${levels.Moderate}</div>
                <div class="summary-label">⚠️ Moderate</div>
            </div>
            <div class="summary-card summary-high">
                <div class="summary-count">${levels.High}</div>
                <div class="summary-label">🔶 High Risk</div>
            </div>
            <div class="summary-card summary-critical">
                <div class="summary-count">${levels.Critical}</div>
                <div class="summary-label">🔴 Critical</div>
            </div>
        `;

        // Table rows
        batchTableBody.innerHTML = "";
        data.results.forEach((emp, index) => {
            const topFactor = emp.factors[0];
            const tr = document.createElement("tr");
            tr.style.animationDelay = `${index * 0.05}s`;
            tr.className = "batch-row";

            tr.innerHTML = `
                <td class="emp-name-cell">${escapeHtml(emp.employee_id)}</td>
                <td>
                    <div class="score-pill" style="background: ${hexToRgba(emp.risk_color, 0.15)}; color: ${emp.risk_color}; border: 1px solid ${hexToRgba(emp.risk_color, 0.3)}">
                        ${emp.risk_score}
                    </div>
                </td>
                <td>
                    <span class="level-badge" style="color: ${emp.risk_color}">
                        ${emp.risk_emoji} ${emp.risk_level}
                    </span>
                </td>
                <td class="top-factor-cell">
                    <span class="factor-tag ${topFactor.impact > 0 ? 'factor-up' : 'factor-down'}">
                        ${topFactor.label}: ${topFactor.impact > 0 ? '+' : ''}${topFactor.impact.toFixed(1)}
                    </span>
                </td>
                <td>
                    <button class="detail-btn" data-index="${index}">View Details</button>
                </td>
            `;

            batchTableBody.appendChild(tr);
        });

        // Attach detail button handlers
        document.querySelectorAll(".detail-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.index);
                showEmployeeDetail(data.results[idx]);
            });
        });

        // Scroll to results
        batchResults.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // ── Employee Detail Modal ───────────────────────────────────────────
    function showEmployeeDetail(emp) {
        employeeModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        const maxImpact = Math.max(...emp.factors.map(f => Math.abs(f.impact)), 1);

        let factorsHtml = emp.factors.map((factor, i) => {
            const isPositive = factor.impact > 0;
            const barWidth = (Math.abs(factor.impact) / maxImpact) * 100;
            const cls = isPositive ? "positive" : "negative";
            return `
                <div class="factor-item" style="animation-delay: ${i * 0.06}s">
                    <div class="factor-info">
                        <div class="factor-name">${factor.label} <span style="color:var(--text-muted);font-weight:400;font-size:0.75rem">= ${factor.value}</span></div>
                        <div class="factor-bar-container">
                            <div class="factor-bar ${cls}" style="width: ${barWidth}%"></div>
                        </div>
                    </div>
                    <div class="factor-impact ${cls}">
                        ${isPositive ? "+" : ""}${factor.impact.toFixed(1)} pts
                        <span class="factor-direction">${factor.direction}</span>
                    </div>
                </div>
            `;
        }).join("");

        let recsHtml = emp.recommendations.map((rec, i) => `
            <div class="rec-item" style="animation-delay: ${i * 0.08}s">
                <div class="rec-icon">${rec.icon}</div>
                <div>
                    <div class="rec-title">${rec.title}</div>
                    <div class="rec-desc">${rec.desc}</div>
                </div>
            </div>
        `).join("");

        modalBody.innerHTML = `
            <div class="modal-employee-header">
                <h2>${escapeHtml(emp.employee_id)}</h2>
                <div class="risk-badge" style="background: ${hexToRgba(emp.risk_color, 0.12)}; border: 1px solid ${hexToRgba(emp.risk_color, 0.3)}; color: ${emp.risk_color}">
                    ${emp.risk_emoji} ${emp.risk_level} Risk — ${emp.risk_score}/100
                </div>
            </div>

            <div class="modal-section">
                <h3>Contributing Factors</h3>
                <p class="card-subtitle">SHAP-based feature impact analysis</p>
                <div class="factors-list">${factorsHtml}</div>
            </div>

            <div class="modal-section">
                <h3>💡 Recommendations</h3>
                <div class="recs-grid">${recsHtml}</div>
            </div>
        `;
    }

    function closeModal() {
        employeeModal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !employeeModal.classList.contains("hidden")) {
            closeModal();
        }
    });

    // ── Core: Analyze Risk (Manual) ─────────────────────────────────────
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

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
})();
