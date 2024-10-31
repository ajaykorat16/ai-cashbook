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

        encoder = LabelEncoder()
        df["amount"] = df["amount"].apply(clean_amount)
        df["narrative_encoded"] = encoder.fit_transform(df["narrative"])

        # Prepare features and target
        X = df[["narrative_encoded", "amount"]]
        y = df["category"]

        # Train model
        model = RandomForestClassifier(random_state=42)
        model.fit(X, y)

        return model, encoder

    @staticmethod
    def classify(model, encoder, input_file_path, output_file_path=None):
        try:
            # Load the input data
            df = pd.read_csv(input_file_path)
        except FileNotFoundError:
            logger.error(f"Input file not found: {input_file_path}")
            return

        predictions = []

        for _, row in df.iterrows():
            narrative_input = row["narrative"]
            amount_input = clean_amount(row["amount"])

            if model and encoder:
                # Handle unseen narrative input
                if narrative_input not in encoder.classes_:
                    logger.warning(f"Unseen narrative value: {narrative_input}")
                    encoder.classes_ = np.append(encoder.classes_, narrative_input)

                narrative_encoded = encoder.transform([narrative_input])
                input_data = pd.DataFrame(
                    {
                        "narrative_encoded": [narrative_encoded[0]],
                        "amount": [amount_input],
                    }
                )
                prediction = model.predict(input_data)
                predictions.append(prediction[0])
            else:
                logger.warning(f"No model/encoder found for user.")
                predictions.append(None)

        # Save predictions
        df["category"] = predictions
        save_path = output_file_path if output_file_path else input_file_path
        df.to_csv(save_path, index=False)
        logger.info(f"Predictions saved to {save_path}")

    @staticmethod
    def test(model, encoder, test_file_path):
        # Load the test data
        df = pd.read_csv(test_file_path)

        predictions = []
        true_values = []
        failed_rows = []

        for index, row in df.iterrows():
            narrative_input = row["narrative"]
            amount_input = clean_amount(row["amount"])
            true_category = row["category"]

            if model and encoder:
                # Handle unseen narrative input
                if narrative_input not in encoder.classes_:
                    encoder.classes_ = np.append(encoder.classes_, narrative_input)

                narrative_encoded = encoder.transform([narrative_input])
                input_data = pd.DataFrame(
                    {
                        "narrative_encoded": [narrative_encoded[0]],
                        "amount": [amount_input],
                    }
                )

                prediction = model.predict(input_data)[0]

                predictions.append(prediction)
                true_values.append(true_category)

                # If the prediction is incorrect, store the failed row
                if prediction != true_category:
                    failed_rows.append(
                        [
                            row["narrative"],
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
        failed_df = pd.DataFrame(failed_rows)
        return failed_df
