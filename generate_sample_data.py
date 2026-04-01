"""
Generate Sample Raw Company Data
Creates a realistic messy CSV file that simulates raw company HR/productivity data.
This file can be used to test the upload & clean functionality.
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

NUM_EMPLOYEES = 25

# Generate employee data with realistic messy formatting
data = {
    "Employee Name": [
        "Alice Johnson", "Bob Smith", "Carol Williams", "David Brown",
        "Eva Martinez", "Frank Garcia", "Grace Lee", "Henry Wilson",
        "Irene Taylor", "Jack Anderson", "Karen Thomas", "Leo Jackson",
        "Mia White", "Nathan Harris", "Olivia Martin", "Paul Thompson",
        "Quinn Robinson", "Rachel Clark", "Sam Rodriguez", "Tina Lewis",
        "Uma Walker", "Victor Hall", "Wendy Allen", "Xavier Young",
        "Yara King"
    ],
    "Department": [
        "Engineering", "Marketing", "Engineering", "Sales", "HR",
        "Engineering", "Design", "Sales", "Marketing", "Engineering",
        "HR", "Engineering", "Design", "Sales", "Marketing",
        "Engineering", "HR", "Design", "Engineering", "Sales",
        "Marketing", "Engineering", "HR", "Design", "Sales"
    ],
    "Email": [
        f"{name.split()[0].lower()}@company.com"
        for name in [
            "Alice Johnson", "Bob Smith", "Carol Williams", "David Brown",
            "Eva Martinez", "Frank Garcia", "Grace Lee", "Henry Wilson",
            "Irene Taylor", "Jack Anderson", "Karen Thomas", "Leo Jackson",
            "Mia White", "Nathan Harris", "Olivia Martin", "Paul Thompson",
            "Quinn Robinson", "Rachel Clark", "Sam Rodriguez", "Tina Lewis",
            "Uma Walker", "Victor Hall", "Wendy Allen", "Xavier Young",
            "Yara King"
        ]
    ],
    # Messy column names on purpose
    "tasks assigned": np.random.randint(8, 48, NUM_EMPLOYEES),
    "Tasks Completed": np.random.randint(5, 45, NUM_EMPLOYEES),
    "context switches": np.random.randint(2, 24, NUM_EMPLOYEES),
    " Avg Focus Time (mins) ": np.random.randint(15, 115, NUM_EMPLOYEES),
    "Weekly Hours": np.round(np.random.uniform(32, 48, NUM_EMPLOYEES), 1),
    "after hours (mins)": np.random.randint(0, 550, NUM_EMPLOYEES),
    "Deadlines Missed": np.random.randint(0, 5, NUM_EMPLOYEES),
    "Join Date": pd.date_range("2020-01-15", periods=NUM_EMPLOYEES, freq="45D").strftime("%Y-%m-%d").tolist(),
}

df = pd.DataFrame(data)

# Ensure tasks_completed <= tasks_assigned
for i in range(len(df)):
    if df.loc[i, "Tasks Completed"] > df.loc[i, "tasks assigned"]:
        df.loc[i, "Tasks Completed"] = df.loc[i, "tasks assigned"] - np.random.randint(0, 4)

# Introduce some missing values (realistic — a few cells are blank)
missing_indices = [(3, "context switches"), (7, "after hours (mins)"),
                   (12, " Avg Focus Time (mins) "), (18, "Deadlines Missed"),
                   (21, "tasks assigned")]
for row, col in missing_indices:
    df.loc[row, col] = np.nan

# Save to project root
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_raw_company_data.csv")
df.to_csv(output_path, index=False)
print(f"✅ Generated sample raw company data: {output_path}")
print(f"   → {len(df)} employees, {len(df.columns)} columns")
print(f"   → Includes messy column names, extra columns, and {len(missing_indices)} missing values")
print(f"\nPreview:")
print(df.head(10).to_string())
