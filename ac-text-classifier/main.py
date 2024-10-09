import sys
import logging
from classify import Classify
from dotenv import load_dotenv
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants
BASE_MODEL_PATH = os.getenv("MODEL_PATH", "./models")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        logger.error(
            "Usage: python main.py [train/classify] [user_id] [file_path] [optional_output_file_path]"
        )
        sys.exit(1)

    operation = sys.argv[1]
    user_id = sys.argv[2]
    file_path = sys.argv[3]
    output_file_path = sys.argv[4] if len(sys.argv) == 5 else None

    classifier = Classify(user_id, base_model_path=BASE_MODEL_PATH)

    if operation == "train":
        classifier.train(file_path)
    elif operation == "classify":
        classifier.classify(file_path, output_file_path)
    else:
        logger.error("Invalid operation. Use 'train' or 'classify'.")
