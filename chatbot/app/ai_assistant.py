import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

from groq import Groq
from app.config import GROQ_API_KEY
from app.analytics import fetch_household_data, average, get_day_value, percentage, detect_anomaly, weekly_summary
from app.predictor import predict_monthly_bill

client = Groq(api_key=GROQ_API_KEY)

def test_connection():
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "user",
                "content": "Say hello in one short sentence."
            }
        ]
    )
    return response.choices[0].message.content


def build_context(consumption, avg, temperature, household_size, has_ac, peak_usage, saving_result, is_anomaly, predicted_monthly_kwh, estimated_bill):
    context = f"""
Today's data for this household:
- Consumption: {consumption} kWh
- Usual average: {avg} kWh
- Temperature: {temperature}°C
- Household size: {household_size}
- Has AC: {"Yes" if has_ac else "No"}
- Peak hours usage: {peak_usage} kWh
- Saving analysis: {saving_result}
- Is today's consumption unusual (anomaly)?: {"Yes" if is_anomaly else "No"}
- Predicted monthly consumption: {predicted_monthly_kwh} kWh
- Estimated monthly bill: {estimated_bill} EGP
"""
    return context


def ask_ai(context, question):

    prompt = f"""
{context}

User question: {question}

Answer the question based only on the data above.

Reply in the same language as the user's question.
If the question is in Arabic, reply in Arabic (Egyptian dialect).
If the question is in English, reply in English.

Keep the answer clear, friendly, and concise.
"""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"AI connection error: {e}")
        return "عذرًا، حصلت مشكلة في الاتصال بالمساعد الذكي حاليًا. حاول تاني بعد شوية."


def build_household_context(household_id):

    df = fetch_household_data(household_id)

    if df.empty:
        return None

    row = df.iloc[-1]

    avg = average(df)
    day_value = get_day_value(df, row['date'])

    saving_result = percentage(day_value, avg)

    anomalies = detect_anomaly(df)
    is_anomaly = row['date'] in anomalies['date'].values

    prediction = predict_monthly_bill(df)

    context = build_context(
        row['energy_consumption_kwh'],
        avg,
        row['avg_temperature_c'],
        row['household_size'],
        row['has_ac'],
        row['peak_hours_usage_kwh'],
        saving_result,
        is_anomaly,
        prediction['predicted_monthly_kwh'],
        prediction['estimated_bill_egp']
    )

    return context


def get_ai_response(household_id, question):
    context = build_household_context(household_id)

    if context is None:
        return "عذرًا، لا توجد بيانات لهذا المنزل. تأكد من رقم المنزل وحاول مرة أخرى."

    answer = ask_ai(context, question)
    return answer

def get_smart_tip(household_id, question):

    context = build_household_context(household_id)

    if context is None:
        return "عذرًا، لا توجد بيانات لهذا المنزل. تأكد من رقم المنزل وحاول مرة أخرى."

    instructions = """
    Provide one practical and specific tip to reduce this household's electricity consumption.

    Important rules:
    - Use ONLY information explicitly provided in the household data.
    - Do NOT invent, assume, or infer any household information.
    - Do NOT mention any electrical appliance unless that appliance is explicitly mentioned in the household data.
    - For example, do NOT assume the household has a washing machine, dishwasher, refrigerator, heater, lights, or any other appliance unless it is explicitly stated in the data.
    - Do NOT invent or assume usage times, operating hours, peak hours, or specific times such as "after 8 PM" unless they are explicitly provided in the household data.
    - Do NOT invent any numbers, consumption values, temperatures, percentages, savings amounts, or other measurements.
    - Every number mentioned in the answer must come directly from the household data.
    - You may use general knowledge about electricity saving ONLY to explain how to act on a pattern that is actually supported by the household data.
    - Do NOT use general knowledge to assume the reason behind the household's consumption.
    - Connect the tip to at least two variables that are explicitly present in the household data.
    - Do not give generic tips.
    - If the available data is not sufficient to provide a specific and reliable tip, say so clearly instead of making an assumption.
    - Keep the answer within two sentences.
    """

    prompt = f"""
{instructions}

User question: {question}

Household data:
{context}

Answer the user's question based ONLY on the household data above.
"""

    return ask_ai(context, prompt)


def build_weekly_context(summary):

    

    anomaly_text = (
        f"Yes, on: {', '.join(summary['anomaly_days'])}"
        if summary["has_anomaly"]
        else "No"
    )

    context = f"""
Weekly data for this household (last 7 available days):
- Average daily consumption: {summary['average_daily_kwh']} kWh
- Highest consumption day: {summary['max_day']['date']} ({summary['max_day']['value']} kWh)
- Lowest consumption day: {summary['min_day']['date']} ({summary['min_day']['value']} kWh)
- Any unusual (anomalous) days this week?: {anomaly_text}
"""
    return context


def get_weekly_summary(household_id, question):

    df = fetch_household_data(household_id)

    if df.empty:
        return "عذرًا، لا توجد بيانات لهذا المنزل. تأكد من رقم المنزل وحاول مرة أخرى."

    summary = weekly_summary(df)
    context = build_weekly_context(summary)

    answer = ask_ai(context, question)
    return answer



if __name__ == "__main__":
    household_id = input("Enter household ID: ")

    while True:
        question = input("Ask about your consumption (or type 'exit' to quit): ")

        if question == "exit":
            break

        answer = get_ai_response(household_id, question)

        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        response_path = os.path.join(BASE_DIR, "..", "response.txt")

        with open(response_path, "w", encoding="utf-8") as f:
            f.write(answer)

        print("Done, check response.txt")