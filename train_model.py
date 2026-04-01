import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import shap
import joblib

print("1. Loading the 6,000-row dataset...")
df = pd.read_csv('burnout_dataset_6000.csv')

# Separate the Features (Inputs) from the Target (Output)
X = df.drop(columns=['Employee_ID', 'Burnout_Risk_Score'])
y = df['Burnout_Risk_Score']

print("2. Splitting data into 80% Training and 20% Testing...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("3. Training the Random Forest Model...")
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print("4. Testing the Model's Accuracy...")
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print(f"   -> Average Error (MAE): {mae:.2f} points off")
print(f"   -> Accuracy Score (R2): {r2*100:.2f}%")

print("5. Saving the Model for the Backend...")
joblib.dump(model, 'burnout_model.pkl')
print("   -> Successfully saved as 'burnout_model.pkl'!")

print("\n6. Running SHAP Explainer (Testing how it explains Burnout)...")
# Initialize SHAP to explain WHY someone is burning out
explainer = shap.TreeExplainer(model)
employee_data = X_test.iloc[[0]] # Grabbing the first employee in our test set
actual_score = y_test.iloc[0]

# Calculate SHAP values
shap_values = explainer.shap_values(employee_data)
predicted_score = model.predict(employee_data)[0]

print(f"\n--- Example Employee Burnout Analysis ---")
print(f"Actual Risk Score: {actual_score}")
print(f"Predicted Risk Score: {predicted_score:.1f}")
print("\nTop Contributing Factors:")

# Match the features to their impact score
factors = pd.DataFrame({'Feature': X_test.columns, 'Impact': shap_values[0]})
factors = factors.reindex(factors.Impact.abs().sort_values(ascending=False).index)

for index, row in factors.iterrows():
    direction = "Increased risk" if row['Impact'] > 0 else "Decreased risk"
    print(f"- {row['Feature']}: {direction} by {abs(row['Impact']):.1f} points")