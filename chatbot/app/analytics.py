import pandas as pd
from app.config import supabase


def fetch_household_data(household_id):
    response = supabase.table("energy_consumption").select("*").eq("household_id", household_id).execute()
    df = pd.DataFrame(response.data)
    return df

def average(rows):
    avg = rows['energy_consumption_kwh'].mean()
    return avg


def compare_to_average(amount, avg):
    if amount > avg:
        return "your consumption is high"
    else:
        return "you're good"


def get_day_value(df, date):
    day_value = df[df['date'] == date]['energy_consumption_kwh'].iloc[0]
    return day_value



def percentage(amount,avg):

    saving_percentage = ((avg - amount) / avg) * 100

    if saving_percentage <= 0:
        return "warning..! Your consumption is very High"
  
    elif saving_percentage <= 10:
        return f"Your saving_percentage is {saving_percentage} %  , You Got 5 points"
        
    elif saving_percentage <= 20:
        return f"Your saving_percentage is {saving_percentage} %  , You Got 10 points"
    else:
        return f"Your saving_percentage is {saving_percentage} %  , You Got 20 points"

    
    

def detect_anomaly(df):
    avg = df['energy_consumption_kwh'].mean()
    std = df['energy_consumption_kwh'].std()

    df['Z_score'] = (df['energy_consumption_kwh'] - avg) / std

    anomalies = df[(df['Z_score'] >= 2) | (df['Z_score'] <= -2)]

    return anomalies


def weekly_summary(df):


    if df is None or df.empty:
        return {
            "average_daily_kwh": None,
            "max_day": None,
            "min_day": None,
            "has_anomaly": False,
            "anomaly_days": []
        }

    avg = average(df)

    # 2) أعلى وأقل يوم
    max_row = df.loc[df["energy_consumption_kwh"].idxmax()]
    min_row = df.loc[df["energy_consumption_kwh"].idxmin()]

    # 3) كشف الشذوذ - باستخدام detect_anomaly() الموجودة عندك بالفعل
    anomalies_df = detect_anomaly(df)
    anomaly_days = anomalies_df["date"].tolist() if not anomalies_df.empty else []

    return {
        "average_daily_kwh": round(float(avg), 2),
        "max_day": {
            "date": max_row["date"],
            "value": round(float(max_row["energy_consumption_kwh"]), 2)
        },
        "min_day": {
            "date": min_row["date"],
            "value": round(float(min_row["energy_consumption_kwh"]), 2)
        },
        "has_anomaly": len(anomaly_days) > 0,
        "anomaly_days": anomaly_days
    }
