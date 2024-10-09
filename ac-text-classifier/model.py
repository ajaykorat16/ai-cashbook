import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_day_from_date(date_value):
    def excel_to_datetime(excel_date):
        excel_start_date = datetime(1900, 1, 1)
        return excel_start_date + timedelta(days=int(excel_date) - 2)

    try:
        if isinstance(date_value, str):
            parsed_date = datetime.strptime(date_value, "%Y-%m-%d")
        else:
            parsed_date = excel_to_datetime(date_value)
    except ValueError:
        raise ValueError(
            "Invalid date format. Provide either '%Y-%m-%d' or a valid Excel serial date."
        )
    return parsed_date.strftime("%d")


def clean_amount(amt):
    return float(amt.replace("$", "").replace(",", "")) if isinstance(amt, str) else amt


# Model class to handle training and classification
class Model:
    @staticmethod
    def train(training_file_path):
        try:
            # Load training data
            df = pd.read_csv(training_file_path)
        except FileNotFoundError:
            logger.error(f"Training file not found: {training_file_path}")
            return None, None

        df["Day"] = df["date"].apply(extract_day_from_date)
        df["account"] = df["account"].fillna("NOACCOUNT")

        models = {}
        encoders = {}
        print(df)
        for account in df["account"].unique():
            account_data = df[df["account"] == account].copy()

            # Encode day
            le_day = LabelEncoder()
            account_data["day_encoded"] = le_day.fit_transform(account_data["Day"])

            # Clean amount column
            account_data["amount"] = account_data["amount"].apply(clean_amount)

            # Prepare features and target
            X = account_data[["day_encoded", "amount"]]
            y = account_data["category"]

            # Train model
            model = RandomForestClassifier(random_state=42)
            model.fit(X, y)

            # Store models and encoders
            models[account] = model
            encoders[account] = le_day

        return models, encoders

    @staticmethod
    def classify(models, encoders, input_file_path, output_file_path=None):
        try:
            # Load the input data
            df = pd.read_csv(input_file_path)
        except FileNotFoundError:
            logger.error(f"Input file not found: {input_file_path}")
            return

        df["Day"] = df["date"].apply(extract_day_from_date)
        df["account"] = df["account"].fillna("NOACCOUNT")
        predictions = []

        for _, row in df.iterrows():
            account = row["account"]
            day_input = row["Day"]
            amount_input = clean_amount(row["amount"])

            # Get model and encoder for the account
            model = models.get(account)
            encoder = encoders.get(account)

            if model and encoder:
                # Handle unseen day input
                if day_input not in encoder.classes_:
                    logger.warning(
                        f"Unseen day value for account {account}: {day_input}"
                    )
                    encoder.classes_ = np.append(encoder.classes_, day_input)

                day_encoded = encoder.transform([day_input])
                input_data = pd.DataFrame(
                    {"day_encoded": [day_encoded[0]], "amount": [amount_input]}
                )
                prediction = model.predict(input_data)
                predictions.append(prediction[0])
            else:
                logger.warning(f"No model/encoder found for account: {account}")
                predictions.append(None)

        # Save predictions
        df["account"] = df["account"].replace("NOACCOUNT")
        df["category"] = predictions
        save_path = output_file_path if output_file_path else input_file_path
        df.to_csv(save_path, index=False)
        logger.info(f"Predictions saved to {save_path}")

    @staticmethod
    def test(models, encoders, test_file_path):
        # Load the test data
        df = pd.read_csv(test_file_path)
        df["Day"] = df["date"].apply(extract_day_from_date)
        df["account"] = df["account"].fillna("NOACCOUNT")
        predictions = []
        true_values = []
        failed_rows = []

        for index, row in df.iterrows():
            account = row["account"]
            day_input = row["Day"]
            amount_input = clean_amount(row["amount"])
            true_category = row["category"]

            # Get the model and encoder for the account
            model = models.get(account)
            encoder = encoders.get(account)

            if model and encoder:
                # Handle unseen day input
                if day_input not in encoder.classes_:
                    encoder.classes_ = np.append(encoder.classes_, day_input)

                day_encoded = encoder.transform([day_input])
                input_data = pd.DataFrame(
                    {"day_encoded": [day_encoded[0]], "amount": [amount_input]}
                )
                prediction = model.predict(input_data)[0]

                predictions.append(prediction)
                true_values.append(true_category)

                # If the prediction is incorrect, store the failed row
                if prediction != true_category:
                    failed_rows.append(
                        [
                            row["account"],
                            row["date"],
                            row["amount"],
                            true_category,
                            prediction,
                        ]
                    )

            else:
                # If no model is found, append None to predictions
                predictions.append(None)
                true_values.append(true_category)

        # Calculate accuracy
        accuracy = accuracy_score(true_values, predictions)
        print(f"Model accuracy: {accuracy * 100:.2f}%")

        return pd.DataFrame(failed_rows)
