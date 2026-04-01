"""
Data Cleaner Module
Cleans raw company CSV data and transforms it into model-ready features
for burnout risk prediction.
"""

import pandas as pd
import numpy as np
import re


# The 7 features the model expects
MODEL_FEATURES = [
    "Tasks_Assigned",
    "Tasks_Completed",
    "Context_Switches_Per_Day",
    "Avg_Uninterrupted_Work_Mins",
    "Standard_Hours_Logged",
    "After_Hours_Mins",
    "Missed_Deadlines",
]

# Valid ranges for each feature (matching slider ranges)
FEATURE_RANGES = {
    "Tasks_Assigned":              (5, 50),
    "Tasks_Completed":             (3, 50),
    "Context_Switches_Per_Day":    (1, 25),
    "Avg_Uninterrupted_Work_Mins": (10, 120),
    "Standard_Hours_Logged":       (30, 50),
    "After_Hours_Mins":            (0, 600),
    "Missed_Deadlines":            (0, 5),
}

# Map of common messy column name variants → canonical feature name
COLUMN_ALIASES = {
    # Tasks Assigned
    "tasks_assigned":       "Tasks_Assigned",
    "tasks assigned":       "Tasks_Assigned",
    "task_assigned":        "Tasks_Assigned",
    "task assigned":        "Tasks_Assigned",
    "assigned_tasks":       "Tasks_Assigned",
    "assigned tasks":       "Tasks_Assigned",
    "no_of_tasks":          "Tasks_Assigned",
    "num_tasks":            "Tasks_Assigned",
    "total_tasks":          "Tasks_Assigned",
    "total tasks":          "Tasks_Assigned",
    # Tasks Completed
    "tasks_completed":      "Tasks_Completed",
    "tasks completed":      "Tasks_Completed",
    "task_completed":       "Tasks_Completed",
    "task completed":       "Tasks_Completed",
    "completed_tasks":      "Tasks_Completed",
    "completed tasks":      "Tasks_Completed",
    "tasks_done":           "Tasks_Completed",
    "tasks done":           "Tasks_Completed",
    # Context Switches
    "context_switches_per_day":  "Context_Switches_Per_Day",
    "context switches per day":  "Context_Switches_Per_Day",
    "context_switches":          "Context_Switches_Per_Day",
    "context switches":          "Context_Switches_Per_Day",
    "ctx_switches":              "Context_Switches_Per_Day",
    "switches_per_day":          "Context_Switches_Per_Day",
    "daily_context_switches":    "Context_Switches_Per_Day",
    # Avg Uninterrupted Work
    "avg_uninterrupted_work_mins":  "Avg_Uninterrupted_Work_Mins",
    "avg uninterrupted work mins":  "Avg_Uninterrupted_Work_Mins",
    "avg_uninterrupted_work":       "Avg_Uninterrupted_Work_Mins",
    "uninterrupted_work_mins":      "Avg_Uninterrupted_Work_Mins",
    "uninterrupted_work":           "Avg_Uninterrupted_Work_Mins",
    "focus_time_mins":              "Avg_Uninterrupted_Work_Mins",
    "focus_time":                   "Avg_Uninterrupted_Work_Mins",
    "avg focus time (mins)":        "Avg_Uninterrupted_Work_Mins",
    "deep_work_mins":               "Avg_Uninterrupted_Work_Mins",
    # Standard Hours
    "standard_hours_logged":    "Standard_Hours_Logged",
    "standard hours logged":    "Standard_Hours_Logged",
    "standard_hours":           "Standard_Hours_Logged",
    "standard hours":           "Standard_Hours_Logged",
    "weekly_hours":             "Standard_Hours_Logged",
    "weekly hours":             "Standard_Hours_Logged",
    "hours_logged":             "Standard_Hours_Logged",
    "work_hours":               "Standard_Hours_Logged",
    "work hours":               "Standard_Hours_Logged",
    # After Hours
    "after_hours_mins":     "After_Hours_Mins",
    "after hours mins":     "After_Hours_Mins",
    "after_hours_work":     "After_Hours_Mins",
    "after hours (mins)":   "After_Hours_Mins",
    "after_hours":          "After_Hours_Mins",
    "overtime_mins":        "After_Hours_Mins",
    "overtime":             "After_Hours_Mins",
    "overtime_minutes":     "After_Hours_Mins",
    "extra_hours_mins":     "After_Hours_Mins",
    # Missed Deadlines
    "missed_deadlines":     "Missed_Deadlines",
    "missed deadlines":     "Missed_Deadlines",
    "missed_deadline":      "Missed_Deadlines",
    "deadlines_missed":     "Missed_Deadlines",
    "deadlines missed":     "Missed_Deadlines",
    "late_deliveries":      "Missed_Deadlines",
}


def _normalize_column_name(col: str) -> str:
    """Lowercase, strip whitespace, and collapse multiple spaces/underscores."""
    col = str(col).strip().lower()
    col = re.sub(r'\s+', ' ', col)
    return col


def _map_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Try to map raw column names to the canonical model feature names.
    Returns a DataFrame with only the matched columns, renamed.
    """
    rename_map = {}
    normalized_cols = {_normalize_column_name(c): c for c in df.columns}

    for alias, canonical in COLUMN_ALIASES.items():
        if alias in normalized_cols and canonical not in rename_map.values():
            rename_map[normalized_cols[alias]] = canonical

    # Also try exact matches (case-insensitive)
    for feat in MODEL_FEATURES:
        if feat not in rename_map.values():
            feat_lower = feat.lower()
            if feat_lower in normalized_cols:
                rename_map[normalized_cols[feat_lower]] = feat

    df = df.rename(columns=rename_map)
    return df


def clean_data(df: pd.DataFrame) -> tuple:
    """
    Clean raw company data into model-ready features.

    Args:
        df: Raw DataFrame from uploaded CSV

    Returns:
        tuple: (cleaned_df, employee_ids, warnings)
            - cleaned_df: DataFrame with exactly the 7 MODEL_FEATURES columns
            - employee_ids: list of employee identifiers (or row indices)
            - warnings: list of warning messages about cleaning steps taken
    """
    warnings = []
    original_rows = len(df)

    # Strip whitespace from column names
    df.columns = df.columns.str.strip()

    # Try to extract employee identifiers before mapping
    employee_ids = []
    id_col = None
    for col in df.columns:
        col_lower = _normalize_column_name(col)
        if col_lower in ("employee_id", "emp_id", "id", "employee id",
                         "employee_name", "employee name", "name", "emp_name"):
            id_col = col
            break

    if id_col:
        employee_ids = df[id_col].astype(str).tolist()
    else:
        employee_ids = [f"Employee {i+1}" for i in range(len(df))]

    # Map columns
    df = _map_columns(df)

    # Check which model features we found
    found = [f for f in MODEL_FEATURES if f in df.columns]
    missing = [f for f in MODEL_FEATURES if f not in df.columns]

    if not found:
        raise ValueError(
            "Could not identify any of the required features in the uploaded data. "
            f"Expected columns similar to: {', '.join(MODEL_FEATURES)}"
        )

    if missing:
        warnings.append(f"Missing columns (will use defaults): {', '.join(missing)}")

    # Keep only model features
    for feat in missing:
        # Use midpoint of valid range as default
        low, high = FEATURE_RANGES[feat]
        default_val = (low + high) / 2
        df[feat] = default_val
        warnings.append(f"  → '{feat}' set to default value {default_val}")

    df = df[MODEL_FEATURES].copy()

    # Convert to numeric, coercing errors to NaN
    for col in MODEL_FEATURES:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Handle missing values — fill with column median
    nan_counts = df.isna().sum()
    cols_with_nan = nan_counts[nan_counts > 0]
    if len(cols_with_nan) > 0:
        for col, count in cols_with_nan.items():
            median_val = df[col].median()
            if pd.isna(median_val):
                # If all values are NaN, use midpoint of range
                low, high = FEATURE_RANGES[col]
                median_val = (low + high) / 2
            df[col] = df[col].fillna(median_val)
            warnings.append(f"Filled {count} missing value(s) in '{col}' with median ({median_val:.1f})")

    # Drop rows that are completely empty (all NaN after conversion)
    empty_rows = df.isna().all(axis=1).sum()
    if empty_rows > 0:
        df = df.dropna(how='all')
        warnings.append(f"Removed {empty_rows} completely empty row(s)")
        # Update employee_ids to match
        mask = ~df.isna().all(axis=1) if empty_rows > 0 else [True] * len(df)

    # Clip values to valid ranges
    for feat, (low, high) in FEATURE_RANGES.items():
        out_of_range = ((df[feat] < low) | (df[feat] > high)).sum()
        if out_of_range > 0:
            df[feat] = df[feat].clip(low, high)
            warnings.append(f"Clipped {out_of_range} value(s) in '{feat}' to range [{low}, {high}]")

    # Round integer features
    int_features = ["Tasks_Assigned", "Tasks_Completed", "Context_Switches_Per_Day",
                     "Missed_Deadlines"]
    for feat in int_features:
        df[feat] = df[feat].round(0).astype(int)

    # Round Standard_Hours_Logged to 1 decimal
    df["Standard_Hours_Logged"] = df["Standard_Hours_Logged"].round(1)

    # Round After_Hours_Mins to integer
    df["After_Hours_Mins"] = df["After_Hours_Mins"].round(0).astype(int)

    # Round Avg_Uninterrupted_Work_Mins to integer
    df["Avg_Uninterrupted_Work_Mins"] = df["Avg_Uninterrupted_Work_Mins"].round(0).astype(int)

    # Ensure employee_ids length matches cleaned df
    employee_ids = employee_ids[:len(df)]

    final_rows = len(df)
    if final_rows < original_rows:
        warnings.append(f"Cleaned data: {original_rows} → {final_rows} rows")

    return df, employee_ids, warnings
