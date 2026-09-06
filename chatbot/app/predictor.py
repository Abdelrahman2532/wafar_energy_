
import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "consumption_model.pkl"))


tariff = {
    50: 0.68,
    100: 0.87,
    200: 1.06,
    350: 1.74,
    650: 2.18,
    1000: 2.35,
    float("inf"): 2.89
}


def calculate_bill(kwh):
    bill = 0
    previous_limit = 0

    for limit, price in tariff.items():
        if kwh <= previous_limit:
            break

        consumption = min(kwh, limit) - previous_limit
        bill += consumption * price
        previous_limit = limit

    return bill


def predict_monthly_bill(df):

    features = pd.DataFrame([{
        "household_size": df["household_size"].iloc[0],
        "has_ac": 1 if df["has_ac"].iloc[0] else 0,
        "avg_temperature_7d": df["avg_temperature_c"].mean()
    }])


    predicted_weekly = model.predict(features)[0]

    
    predicted_monthly = predicted_weekly * (30 / 7)

    estimated_bill = calculate_bill(predicted_monthly)

    return {
        "predicted_monthly_kwh": round(predicted_monthly, 2),
        "estimated_bill_egp": round(estimated_bill, 2)
    }
