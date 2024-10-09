import sys
import pandas as pd
from datetime import datetime, timedelta
from model import Model
import random


def test_model(input_file):
    models, encoders = Model.train(input_file)
    failed_rows = Model.test(models, encoders, input_file)

    if not failed_rows.empty:
        print("Rows where prediction failed:")
        print(failed_rows)
    else:
        print("All predictions were correct.")


def excel_date_to_datetime(excel_serial_date):
    excel_start_date = datetime(1900, 1, 1)
    corrected_date = excel_start_date + timedelta(days=excel_serial_date - 2)
    return corrected_date


categories = [""]


def assign_random_category(input_file):
    df = pd.read_csv(input_file)
    dfc = pd.read_csv("./data/categories.csv")
    categories = dfc["Tax_Category"].tolist()
    new_df = pd.DataFrame([], columns=["account", "date", "amount", "category"])
    new_df["account"] = df["Account"]
    new_df["amount"] = df["Amt"].apply(
        lambda x: float(x.replace("$", "").replace(",", ""))
    )
    # new_df["date"] = df["Date"].apply(
    #     lambda x: excel_date_to_datetime(x).strftime("%Y-%m-%d")
    # )
    new_df["date"] = df["Date"]
    new_df["category"] = df["Account"].apply(lambda x: random.choice(categories))
    new_df.to_csv("./data/test.csv", index=False)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_model.py [train_file]")
        sys.exit(1)
    input_file = sys.argv[1]
    tim1 = datetime.now()
    test_model(input_file)
    # assign_random_category(input_file)
    tim2 = datetime.now()
    print(f"Time taken: {tim2 - tim1}")
