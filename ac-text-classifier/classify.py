import os
import joblib
import logging
from model import Model

# Set up logging
logger = logging.getLogger(__name__)


# Classify class to manage user-specific models
class Classify:
    def __init__(self, user_id, base_model_path="./models"):
        self.user_id = user_id
        self.user_dir = os.path.join(base_model_path, str(user_id))

        # Create user directory if it doesn't exist
        os.makedirs(self.user_dir, exist_ok=True)

        self.model_file = os.path.join(self.user_dir, "account_model.pkl")
        self.encoder_file = os.path.join(self.user_dir, "account_encoder.pkl")

    def train(self, training_file_path):
        model, encoder = Model.train(training_file_path)
        if model and encoder:
            # Save trained models and encoders
            joblib.dump(model, self.model_file)
            joblib.dump(encoder, self.encoder_file)
            logger.info(
                f"Models and encoders saved for user {self.user_id} in {self.user_dir}"
            )
        else:
            logger.error(f"Training failed for user {self.user_id}")

    def classify(self, input_file_path, output_file_path=None):
        try:
            # Load trained models and encoders
            model = joblib.load(self.model_file)
            encoder = joblib.load(self.encoder_file)
        except FileNotFoundError:
            logger.error(
                f"Model files not found for user {self.user_id}. Train the model first."
            )
            return

        # Classify input data
        Model.classify(model, encoder, input_file_path, output_file_path)
