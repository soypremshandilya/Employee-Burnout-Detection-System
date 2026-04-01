# 🔥 Employee Burnout Risk Detection System

> **AI-Powered Task-Level Employee Wellness Analysis** — A full-stack web application that predicts employee burnout risk using a Random Forest model and explains the results with SHAP (SHapley Additive exPlanations).

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-F7931E?logo=scikit-learn&logoColor=white)
![SHAP](https://img.shields.io/badge/SHAP-0.46-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [ML Model & Pipeline](#-ml-model--pipeline)
- [Input Features](#-input-features)
- [Data Cleaning Pipeline](#-data-cleaning-pipeline)
- [Upload Section — How It Works](#-upload-section--how-it-works)
- [Application Workflow](#-application-workflow)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Sample Data](#-sample-data)
- [Screenshots](#-screenshots)

---

## 📖 About the Project

The **Employee Burnout Risk Detection System** is an end-to-end machine learning web application built as a **Major Project for MCA**. It analyses task-level work metrics — such as workload intensity, context switching, overtime, and missed deadlines — to predict an employee's burnout risk on a 0–100 scale with four risk levels:

| Score Range | Level        | Indicator |
|:-----------:|:------------:|:---------:|
| 0 – 30      | **Low**      | ✅        |
| 31 – 55     | **Moderate** | ⚠️        |
| 56 – 75     | **High**     | 🔶        |
| 76 – 100    | **Critical** | 🔴        |

Beyond just a score, the system provides **SHAP-based explanations** showing exactly which factors are pushing the risk up or down, along with **actionable recommendations** for managers and HR teams.

---

## ✨ Key Features

### 🎛️ Manual Input Mode
- Interactive slider + number inputs for all 7 work metrics
- Instant single-employee burnout analysis
- Animated gauge visualization with needle and arc
- SHAP factor impact bars (sorted by absolute contribution)
- Personalized actionable recommendations
- Expandable technical details panel

### 📁 Batch Upload Mode
- Upload raw company CSV or Excel (.xlsx/.xls) files
- **Automatic data cleaning** — handles messy column names, missing values, extra columns
- Batch predictions for all employees in one click
- Risk distribution summary cards (Low / Moderate / High / Critical counts)
- Sortable results table with per-employee risk scores
- **Per-employee detail modal** with full SHAP breakdown and recommendations
- Downloadable sample CSV for reference

### 🎨 Premium UI/UX
- Dark-themed, glassmorphic design with animated background particles
- Smooth micro-animations and transitions throughout
- Responsive layout that works on all screen sizes
- Tab-based navigation between Manual and Upload modes
- Drag-and-drop file upload zone
- Loading spinners and progress indicators

---

## 🛠 Tech Stack

| Layer           | Technology                                                       |
|:---------------:|:-----------------------------------------------------------------|
| **Frontend**    | HTML5, CSS3 (custom properties, glassmorphism), Vanilla JavaScript |
| **Backend**     | Python 3.10+, Flask 3.1, Flask-CORS                              |
| **ML Model**    | scikit-learn `RandomForestRegressor` (100 trees)                  |
| **Explainability** | SHAP `TreeExplainer`                                           |
| **Data Processing** | Pandas, NumPy                                                |
| **Serialization** | Joblib (model persistence as `.pkl`)                            |
| **Fonts**       | Google Fonts — Inter (weights 300–900)                            |

---

## 📁 Project Structure

```
Employee-Burnout-Detection-System/
├── app.py                        # Flask backend — API routes & SHAP logic
├── train_model.py                # Model training script (RandomForest)
├── data_cleaner.py               # Raw data → model-ready feature cleaner
├── generate_sample_data.py       # Generates sample messy CSV for testing
├── burnout_model.pkl             # Pre-trained model (~18 MB)
├── burnout_dataset_6000.csv      # Training dataset (6,000 records)
├── sample_raw_company_data.csv   # Sample upload file (25 employees)
├── requirements.txt              # Python dependencies
├── README.md                     # You are here
└── static/
    ├── index.html                # Single-page frontend
    ├── style.css                 # Full styling (dark theme, animations)
    └── script.js                 # Frontend logic (tabs, upload, rendering)
```

---

## 🧠 ML Model & Pipeline

### Model: Random Forest Regressor

The system uses a **Random Forest Regressor** with the following configuration:

```python
RandomForestRegressor(n_estimators=100, random_state=42)
```

### Training Pipeline (`train_model.py`)

1. **Load** the `burnout_dataset_6000.csv` dataset containing 6,000 synthetically generated employee records
2. **Split** into 80% training / 20% testing sets (`train_test_split`, `random_state=42`)
3. **Train** a Random Forest model with 100 decision trees
4. **Evaluate** using:
   - **MAE** (Mean Absolute Error) — average point deviation
   - **R² Score** — percentage of variance explained
5. **Save** the trained model as `burnout_model.pkl` using Joblib
6. **Validate SHAP** by running TreeExplainer on a test sample to verify factor explanations

### Why Random Forest?

- Handles non-linear feature interactions naturally
- Robust to outliers and noise in work metrics data
- Provides reliable feature importance rankings
- Compatible with SHAP's `TreeExplainer` for fast, exact explanations
- No feature scaling required — works directly with raw numeric values

### SHAP Explainability

Every prediction is accompanied by a **SHAP (SHapley Additive exPlanations)** breakdown:

- Uses `shap.TreeExplainer` initialized once at server startup
- For each prediction, computes per-feature SHAP values showing how much each feature pushes the score above or below the base value (average risk across training data)
- Results are sorted by absolute impact and displayed as horizontal bars
- Positive SHAP values → "Increases risk" (red bars)
- Negative SHAP values → "Decreases risk" (green bars)

---

## 📊 Input Features

The model expects exactly **7 task-level features**:

| # | Feature Name                  | Description                                      | Range      |
|:-:|:------------------------------|:-------------------------------------------------|:----------:|
| 1 | `Tasks_Assigned`              | Total tasks assigned in the period                | 5 – 50     |
| 2 | `Tasks_Completed`             | Number of tasks actually completed                | 3 – 50     |
| 3 | `Context_Switches_Per_Day`    | How often the employee switches between tasks     | 1 – 25     |
| 4 | `Avg_Uninterrupted_Work_Mins` | Average duration of uninterrupted focus time (min)| 10 – 120   |
| 5 | `Standard_Hours_Logged`       | Weekly standard working hours                     | 30 – 50    |
| 6 | `After_Hours_Mins`            | Total minutes worked outside regular hours        | 0 – 600    |
| 7 | `Missed_Deadlines`            | Number of deadlines missed in the period          | 0 – 5      |

---

## 🧹 Data Cleaning Pipeline

The `data_cleaner.py` module transforms messy, real-world company data into the model's expected format. Here's exactly what it does:

### 1. Column Name Mapping
- Normalizes column names (lowercase, strip whitespace, collapse multiple spaces)
- Matches against an **extensive alias dictionary** with 60+ common variants
- Examples: `"tasks assigned"`, `"Total Tasks"`, `"task_assigned"` → `Tasks_Assigned`
- `"focus_time"`, `"deep_work_mins"`, `"Avg Focus Time (mins)"` → `Avg_Uninterrupted_Work_Mins`
- `"overtime"`, `"extra_hours_mins"` → `After_Hours_Mins`

### 2. Employee ID Extraction
- Automatically detects identifier columns (`Employee_ID`, `emp_id`, `name`, `Employee Name`, etc.)
- Falls back to `"Employee 1"`, `"Employee 2"`, ... if no ID column is found

### 3. Missing Column Defaults
- If a required feature column is missing from the upload, it fills with the **midpoint** of that feature's valid range
- Example: Missing `Missed_Deadlines` → defaults to `2.5` (midpoint of 0–5)
- Every default is logged as a warning shown to the user

### 4. Numeric Coercion
- Converts all feature columns to numeric using `pd.to_numeric(errors='coerce')`
- Non-numeric values (text in numeric columns) become `NaN`

### 5. Missing Value Imputation
- Fills `NaN` values with the **column median**
- If the entire column is `NaN`, falls back to the midpoint of the valid range
- Reports exactly how many values were filled per column

### 6. Empty Row Removal
- Drops rows where **all** feature values are `NaN` after conversion

### 7. Range Clipping
- Clips all values to their valid range (e.g., `After_Hours_Mins` clamped to [0, 600])
- Reports how many out-of-range values were clipped per feature

### 8. Type Rounding
- Integer features (`Tasks_Assigned`, `Tasks_Completed`, `Context_Switches_Per_Day`, `Missed_Deadlines`, `After_Hours_Mins`, `Avg_Uninterrupted_Work_Mins`) → rounded to whole numbers
- `Standard_Hours_Logged` → rounded to 1 decimal place

> All cleaning steps produce **user-visible warnings** displayed in the UI under "Data Cleaning Notes".

---

## 📤 Upload Section — How It Works

The upload workflow is a complete pipeline from raw file to per-employee risk analysis:

```
┌─────────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│  User uploads   │────▶│  Flask reads  │────▶│  data_cleaner  │────▶│  Model predicts │
│  CSV/Excel file │     │  file into    │     │  cleans & maps │     │  + SHAP explains│
│  (drag or browse)│     │  DataFrame    │     │  columns       │     │  per employee   │
└─────────────────┘     └──────────────┘     └────────────────┘     └─────────────────┘
                                                                            │
                                                                            ▼
                                                                  ┌─────────────────┐
                                                                  │  JSON response   │
                                                                  │  with results +  │
                                                                  │  warnings        │
                                                                  └─────────────────┘
```

### Step-by-Step:

1. **User selects a file** — drag-and-drop onto the drop zone, or click "Browse Files" (accepts `.csv`, `.xlsx`, `.xls`)
2. **File info displayed** — filename and size shown with option to remove and re-select
3. **Click "Analyze All Employees"** — sends the file via `POST /upload` as `multipart/form-data`
4. **Backend reads the file** — uses `pd.read_csv()` or `pd.read_excel()` depending on extension
5. **Data cleaning** — `data_cleaner.clean_data()` runs the full 8-step pipeline (described above)
6. **Batch prediction** — model runs `.predict()` on all rows at once for efficiency
7. **SHAP explanation** — `explainer.shap_values()` computes feature impacts for every employee
8. **Risk classification** — each score is bucketed into Low/Moderate/High/Critical with colour and emoji
9. **Recommendations generated** — factor-specific recommendations for each employee
10. **Response sent** — JSON containing all results, warnings, and the SHAP base value
11. **Frontend renders**:
    - **Cleaning warnings** (if any) in a collapsible panel
    - **Summary cards** showing count per risk level
    - **Results table** with employee name, score pill, risk badge, top factor tag
    - **"View Details" button** per employee opens a modal with full SHAP breakdown + recommendations

### Download Sample CSV
A **"Download Sample CSV"** link is available that serves `sample_raw_company_data.csv` — a 25-employee file with intentionally messy column names, extra columns, and missing values to demonstrate the cleaning pipeline.

---

## 🔄 Application Workflow

### Full End-to-End Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌───────────┐    ┌────────────┐    ┌─────────────────────┐  │
│  │ Tab Switch │    │  Slider/   │    │   Upload Drop Zone  │  │
│  │ Manual |   │    │  Number    │    │   + File Info Card  │  │
│  │ Upload     │    │  Inputs    │    │                     │  │
│  └─────┬─────┘    └─────┬──────┘    └──────────┬──────────┘  │
│        │                │                      │             │
│        │       POST /predict          POST /upload           │
│        │         (JSON)              (FormData)               │
└────────┼────────────────┼──────────────────────┼─────────────┘
         │                │                      │
┌────────┼────────────────┼──────────────────────┼─────────────┐
│        │           FLASK BACKEND               │             │
│        │                │                      │             │
│        │         ┌──────▼──────┐      ┌────────▼────────┐    │
│        │         │  /predict   │      │    /upload       │    │
│        │         │  endpoint   │      │    endpoint      │    │
│        │         └──────┬──────┘      └────────┬────────┘    │
│        │                │                      │             │
│        │                │              ┌───────▼────────┐    │
│        │                │              │  data_cleaner  │    │
│        │                │              │  .clean_data() │    │
│        │                │              └───────┬────────┘    │
│        │                │                      │             │
│        │         ┌──────▼──────────────────────▼──────┐      │
│        │         │      Random Forest Model           │      │
│        │         │      (burnout_model.pkl)            │      │
│        │         └──────────────┬─────────────────────┘      │
│        │                       │                             │
│        │              ┌────────▼─────────┐                   │
│        │              │  SHAP Explainer  │                   │
│        │              │  (TreeExplainer) │                   │
│        │              └────────┬─────────┘                   │
│        │                       │                             │
│        │              ┌────────▼─────────┐                   │
│        │              │  Risk Classify + │                   │
│        │              │  Recommendations │                   │
│        │              └────────┬─────────┘                   │
└────────┼───────────────────────┼─────────────────────────────┘
         │                       │
┌────────┼───────────────────────┼─────────────────────────────┐
│        │            FRONTEND   │                             │
│        │         ┌─────────────▼──────────────┐              │
│        │         │  Render Results:           │              │
│        │         │  • Animated Gauge          │              │
│        │         │  • SHAP Factor Bars        │              │
│        │         │  • Recommendations         │              │
│        │         │  • Batch Table + Modals    │              │
│        │         └────────────────────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** installed ([Download](https://www.python.org/downloads/))
- **pip** (comes with Python)
- **Git** (to clone the repository)

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/soypremshandilya/Employee-Burnout-Detection-System.git
cd Employee-Burnout-Detection-System

# 2. (Optional but recommended) Create a virtual environment
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the application
python app.py
```

The server will start on **http://localhost:5000**. Open this URL in your browser.

### What Happens at Startup

1. Flask loads and serves the static frontend
2. The pre-trained `burnout_model.pkl` (~18 MB) is loaded into memory
3. SHAP `TreeExplainer` is initialized (takes a few seconds on first load)
4. The server prints `Ready!` when fully initialized

### (Optional) Retrain the Model

If you want to retrain the model from scratch:

```bash
# Generate fresh training data (optional)
python generate_sample_data.py

# Train the model
python train_model.py
# This will output MAE and R² scores and save a new burnout_model.pkl
```

---

## 🔌 API Endpoints

### `GET /`
Serves the single-page frontend (`static/index.html`).

### `POST /predict`
Single-employee prediction via JSON.

**Request Body:**
```json
{
  "Tasks_Assigned": 30,
  "Tasks_Completed": 18,
  "Context_Switches_Per_Day": 15,
  "Avg_Uninterrupted_Work_Mins": 25,
  "Standard_Hours_Logged": 45,
  "After_Hours_Mins": 300,
  "Missed_Deadlines": 3
}
```

**Response:**
```json
{
  "risk_score": 72.4,
  "risk_level": "High",
  "risk_color": "#f97316",
  "risk_emoji": "🔶",
  "factors": [
    {
      "feature": "After_Hours_Mins",
      "label": "After-Hours Work (min)",
      "value": 300,
      "impact": 12.5,
      "direction": "Increases risk"
    }
  ],
  "recommendations": [
    {
      "title": "Reduce After-Hours Work",
      "desc": "Excessive after-hours work is a major burnout driver...",
      "icon": "🌙"
    }
  ],
  "base_value": 45.2
}
```

### `POST /upload`
Batch prediction via file upload (`multipart/form-data`).

**Request:** Form data with a `file` field containing a CSV or Excel file.

**Response:**
```json
{
  "results": [ /* array of per-employee results (same structure as /predict) */ ],
  "total_employees": 25,
  "warnings": ["Filled 2 missing value(s) in 'After_Hours_Mins' with median (180.0)"],
  "base_value": 45.2
}
```

### `GET /download-sample`
Downloads the `sample_raw_company_data.csv` file for testing the upload feature.

---

## 📋 Sample Data

The project includes two datasets:

| File                            | Purpose                           | Rows | Description                                                                |
|:--------------------------------|:----------------------------------|:----:|:---------------------------------------------------------------------------|
| `burnout_dataset_6000.csv`      | Model training data               | 6,000| Clean dataset with all 7 features + `Burnout_Risk_Score` + `Employee_ID`    |
| `sample_raw_company_data.csv`   | Upload testing                    | 25   | Messy data with inconsistent column names, extra columns, missing values   |

The sample raw data (`generate_sample_data.py`) intentionally includes:
- **Messy column names**: `"tasks assigned"`, `" Avg Focus Time (mins) "`, `"Deadlines Missed"`
- **Extra non-model columns**: `Employee Name`, `Department`, `Email`, `Join Date`
- **Missing values**: 5 randomly placed `NaN` cells
- All of these are handled automatically by the data cleaning pipeline

---

## 📸 Screenshots

> Run the application locally and explore the two modes:
> - **Manual Input** — adjust sliders and click "Analyze Burnout Risk"
> - **Upload Data** — upload a CSV and view batch results with per-employee modals

---

<p align="center">
  <strong>Built with ❤️ as a Major Project for MCA</strong><br/>
  Powered by Random Forest & SHAP Explainability
</p>
