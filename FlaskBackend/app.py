import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import gc
import traceback
from io import BytesIO

from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.models import load_model
from PIL import Image, UnidentifiedImageError
import numpy as np

# Limit TensorFlow CPU threads to avoid high CPU/RAM usage on container hosts
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)

app = Flask(__name__)

# Paths based on the location of this app.py file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.h5")

# Limit uploads to 10 MB
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Load the trained model with compile=False to save memory (no optimizer/training graph needed)
model = load_model(MODEL_PATH, compile=False)

# Get the expected image dimensions from the model
input_shape = model.input_shape
IMG_HEIGHT = int(input_shape[1])
IMG_WIDTH = int(input_shape[2])

print("Model loaded successfully")
print("Expected model input shape:", input_shape)
print("Image resize dimensions:", IMG_WIDTH, "x", IMG_HEIGHT)


# 39 class labels in the exact order the model was trained (alphabetical order from dataset)
class_labels = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___Healthy',
    'Background_without_leaves',
    'Blueberry___Healthy',
    'Cherry___Powdery_mildew',
    'Cherry___Healthy',
    'Corn___Cercospora_leaf_spot',
    'Corn___Common_rust',
    'Corn___Northern_Leaf_Blight',
    'Corn___Healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___Healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___Healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___Healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___Healthy',
    'Raspberry___Healthy',
    'Soybean___Healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___Healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites_Two_spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Yellow_Leaf_Curl_Virus',
    'Tomato___mosaic_virus',
    'Tomato___Healthy'
]


@app.route("/")
def index():
    return "Flask is working", 200


@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({
                "error": "No image uploaded. Send the image using the 'image' field."
            }), 400

        file = request.files["image"]

        if not file or not file.filename:
            return jsonify({"error": "Please select an image."}), 400

        # Read and validate the image without saving it to disk
        try:
            img = Image.open(BytesIO(file.read())).convert("RGB")
        except (UnidentifiedImageError, OSError, ValueError):
            return jsonify({"error": "Invalid or unsupported image file."}), 400

        # Resize to the dimensions expected by the model
        img = img.resize((IMG_WIDTH, IMG_HEIGHT))

        # Convert image to NumPy array
        img_array = np.asarray(img, dtype=np.float32)

        # Preserve normalization used by your existing code.
        # This must match the preprocessing used during model training.
        img_array = img_array / 255.0

        # Add batch dimension: (1, height, width, 3)
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = model.predict(img_array, verbose=0)

        class_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0])) * 100

        if class_index >= len(class_labels):
            return jsonify({
                "error": "Model output does not match the configured class labels."
            }), 500

        predicted_class = class_labels[class_index]

        if "___" in predicted_class:
            plant_name, disease_name = predicted_class.split("___", 1)
        else:
            plant_name = "Non-Plant / Background"
            disease_name = predicted_class

        result = {
            "plant": plant_name,
            "disease": disease_name,
            "confidence": round(confidence, 2),
            "description": get_disease_description(disease_name),
            "treatment": get_treatment_recommendation(disease_name),
            "cause": get_disease_cause(disease_name),
            "precaution": get_disease_precaution(disease_name)
        }

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        app.logger.exception("Error during disease prediction")

        return jsonify({
            "error": "Prediction failed",
            "message": str(e)
        }), 500


def get_disease_description(disease):
    descriptions = {
        "Apple_scab": "Fungal disease causing olive-green to black velvety spots on leaves and scabby lesions on fruit.",
        "Black_rot": "Fungal infection causing circular brown leaf lesions and rotting fruit.",
        "Cedar_apple_rust": "Fungal disease causing bright yellow-orange spots on the upper leaf surface.",
        "Powdery_mildew": "White powdery fungal growth on leaves, shoots, and buds.",
        "Cercospora_leaf_spot": "Small circular or angular tan spots with reddish borders on foliage.",
        "Common_rust": "Pustules on both leaf surfaces producing cinnamon-brown powdery spores.",
        "Northern_Leaf_Blight": "Elongated, grayish-green to tan cigar-shaped lesions on corn leaves.",
        "Esca_(Black_Measles)": "Wood-decaying fungal complex causing tiger-stripe discoloration on leaves.",
        "Leaf_blight_(Isariopsis_Leaf_Spot)": "Irregular necrotic brown lesions on foliage.",
        "Haunglongbing_(Citrus_greening)": "Bacterial disease causing blotchy mottling on leaves and small, lopsided fruit.",
        "Bacterial_spot": "Bacterial disease causing dark, water-soaked angular spots on leaves and stems.",
        "Leaf_scorch": "Fungal disease causing irregular dark purple-brown spots and scorched leaf margins.",
        "Early_blight": "Brown spots with concentric rings and yellow halos forming target-like patterns.",
        "Late_blight": "Water-soaked lesions turning dark brown to purplish-black, causing rapid tissue decay.",
        "Leaf_Mold": "Fungal disease causing pale yellow chlorotic spots on upper leaf surfaces and velvety mold underneath.",
        "Septoria_leaf_spot": "Circular spots with dark borders and sunken grayish-white centers with dark specks.",
        "Spider_mites_Two_spotted_spider_mite": "Foliage stippling and webbing caused by two-spotted spider mite feeding.",
        "Target_Spot": "Brown lesions with distinctive concentric rings expanding across leaves and stems.",
        "Yellow_Leaf_Curl_Virus": "Viral disease causing upward curling, yellowing margins, and stunted growth.",
        "mosaic_virus": "Viral infection producing mottled light and dark green patterns and distorted leaves.",
        "Healthy": "No visible symptoms detected. The plant appears healthy and vigorous.",
        "Background_without_leaves": "No plant foliage detected. The image appears to contain background objects or soil.",
    }
    cleaned = disease.replace("_", " ")
    return descriptions.get(disease, f"Symptoms associated with {cleaned}. Inspect foliage for lesions or discoloration.")

def get_treatment_recommendation(disease):
    treatments = {
        "Apple_scab": "Apply captan or sulfur-based fungicides during early spring. Rake and dispose of fallen infected leaves.",
        "Black_rot": "Prune mummified fruit and cankers. Apply copper or captan fungicides.",
        "Cedar_apple_rust": "Apply preventative fungicides (myclobutanil). Remove nearby juniper hosts if possible.",
        "Powdery_mildew": "Apply potassium bicarbonate, neem oil, or sulfur-based fungicides. Improve airflow.",
        "Cercospora_leaf_spot": "Apply preventative fungicides like azoxystrobin or copper. Practice crop rotation.",
        "Common_rust": "Apply foliar fungicides early in the season if infection is severe.",
        "Northern_Leaf_Blight": "Apply registered fungicides (strobilurins or triazoles) and use resistant cultivars.",
        "Esca_(Black_Measles)": "Prune infected vines during dormant season. Disinfect pruning shears between cuts.",
        "Leaf_blight_(Isariopsis_Leaf_Spot)": "Apply copper-based fungicides after bud break. Remove infected crop residues.",
        "Haunglongbing_(Citrus_greening)": "Control citrus psyllid vectors with insecticides. Remove severely infected trees.",
        "Bacterial_spot": "Apply copper sprays mixed with mancozeb. Avoid overhead watering to limit spread.",
        "Leaf_scorch": "Apply preventative fungicides early in spring. Remove old leaves and maintain weed control.",
        "Early_blight": "Apply chlorothalonil, copper, or mancozeb-based fungicides. Mulch around plant bases.",
        "Late_blight": "Apply copper-based or systemic fungicides immediately. Promptly remove and destroy infected foliage.",
        "Leaf_Mold": "Apply fungicides like mancozeb or copper. Increase greenhouse ventilation and lower humidity.",
        "Septoria_leaf_spot": "Apply chlorothalonil or copper fungicides. Remove infected bottom leaves.",
        "Spider_mites_Two_spotted_spider_mite": "Spray with insecticidal soap, neem oil, or miticide. Introduce predatory mites.",
        "Target_Spot": "Apply preventative fungicides and improve air circulation around plants.",
        "Yellow_Leaf_Curl_Virus": "Control whitefly vector populations using yellow sticky traps and insecticides. Remove infected plants.",
        "mosaic_virus": "No chemical cure. Remove and destroy infected plants. Sanitize tools and control aphid vectors.",
        "Healthy": "No treatment needed. Maintain optimal irrigation, nutrition, and pest monitoring.",
        "Background_without_leaves": "Please upload a clear, well-lit, close-up photo of a plant leaf for disease diagnosis.",
    }
    cleaned = disease.replace("_", " ")
    return treatments.get(disease, f"Remove affected foliage, apply appropriate organic or chemical fungicides for {cleaned}, and maintain good sanitation.")

def get_disease_cause(disease):
    causes = {
        "Apple_scab": "Caused by the fungus Venturia inaequalis.",
        "Black_rot": "Caused by the fungus Botryosphaeria obtusa (or Guignardia bidwellii on grapes).",
        "Cedar_apple_rust": "Caused by the fungus Gymnosporangium juniperi-virginianae.",
        "Powdery_mildew": "Caused by various species of powdery mildew fungi (Erysiphales).",
        "Cercospora_leaf_spot": "Caused by the fungal pathogen Cercospora zeae-maydis.",
        "Common_rust": "Caused by the fungus Puccinia sorghi, favored by cool and moist conditions.",
        "Northern_Leaf_Blight": "Caused by the fungal pathogen Exserohilum turcicum.",
        "Esca_(Black_Measles)": "Caused by a complex of fungal wood-inhabiting pathogens (Phaeomoniella, Phaeoacremonium).",
        "Leaf_blight_(Isariopsis_Leaf_Spot)": "Caused by the fungus Pseudocercospora cladosporioides / Isariopsis clavispora.",
        "Haunglongbing_(Citrus_greening)": "Caused by Candidatus Liberibacter bacteria transmitted by the Asian citrus psyllid.",
        "Bacterial_spot": "Caused by Xanthomonas bacteria species, thriving in warm, wet conditions.",
        "Leaf_scorch": "Caused by the fungus Diplocarpon earlianum.",
        "Early_blight": "Caused by the fungus Alternaria solani.",
        "Late_blight": "Caused by the water mold / oomycete Phytophthora infestans.",
        "Leaf_Mold": "Caused by the fungus Passalora fulva (Fulvia fulva), thriving in high humidity.",
        "Septoria_leaf_spot": "Caused by the fungus Septoria lycopersici.",
        "Spider_mites_Two_spotted_spider_mite": "Infestation by Tetranychus urticae (two-spotted spider mite) during hot, dry weather.",
        "Target_Spot": "Caused by the fungus Corynespora cassiicola.",
        "Yellow_Leaf_Curl_Virus": "Caused by a Begomovirus, transmitted primarily by whiteflies (Bemisia tabaci).",
        "mosaic_virus": "Caused by Tobacco Mosaic Virus (TMV) or Tomato Mosaic Virus (ToMV).",
        "Healthy": "No pathogen detected. Physiological balance maintained.",
        "Background_without_leaves": "Image does not appear to contain plant foliage or crop leaves.",
    }
    cleaned = disease.replace("_", " ")
    return causes.get(disease, f"Fungal, bacterial, or environmental stress factors associated with {cleaned}.")

def get_disease_precaution(disease):
    precautions = {
        "Apple_scab": "Plant scab-resistant cultivars and ensure proper spacing for quick leaf drying.",
        "Black_rot": "Prune out diseased wood and dead mummies during dormant pruning.",
        "Cedar_apple_rust": "Avoid planting susceptible host trees near Eastern red cedars.",
        "Powdery_mildew": "Provide ample sunlight, avoid overhead watering, and ensure adequate spacing.",
        "Cercospora_leaf_spot": "Rotate crops every 1-2 years and incorporate residue tillage.",
        "Common_rust": "Plant resistant hybrids and monitor fields early in the growing season.",
        "Northern_Leaf_Blight": "Use certified disease-free seed and implement crop rotation.",
        "Esca_(Black_Measles)": "Avoid large pruning wounds during wet weather; protect wound sites with sealant.",
        "Leaf_blight_(Isariopsis_Leaf_Spot)": "Maintain proper canopy management and promote good airflow.",
        "Haunglongbing_(Citrus_greening)": "Use certified disease-free nursery stock and inspect trees regularly for psyllid vectors.",
        "Bacterial_spot": "Use disease-free certified seeds, rotate crops, and avoid working in wet fields.",
        "Leaf_scorch": "Remove diseased leaves after harvest and maintain clean drip irrigation.",
        "Early_blight": "Rotate crops with non-solanaceous species and stake plants off the soil.",
        "Late_blight": "Use certified seed tubers, avoid overhead irrigation, and ensure good field drainage.",
        "Leaf_Mold": "Increase greenhouse ventilation, reduce relative humidity below 85%, and avoid overhead watering.",
        "Septoria_leaf_spot": "Mulch soil surface, water at the base of plants, and remove lower infected foliage.",
        "Spider_mites_Two_spotted_spider_mite": "Keep plants well-watered (avoid drought stress) and preserve natural predators.",
        "Target_Spot": "Maintain good plant spacing and avoid overhead irrigation.",
        "Yellow_Leaf_Curl_Virus": "Use physical insect-proof mesh screens, reflective mulches, and plant resistant varieties.",
        "mosaic_virus": "Wash hands with soap and water before handling plants; disinfect tools thoroughly.",
        "Healthy": "Continue regular monitoring, balanced fertilization, and good soil hygiene.",
        "Background_without_leaves": "Ensure the subject is centered, clear, well-lit, and in focus.",
    }
    cleaned = disease.replace("_", " ")
    return precautions.get(disease, f"Isolate affected plants, sanitize pruning tools, avoid excess leaf wetness, and practice crop rotation.")


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({
        "error": "Image is too large. Maximum upload size is 10 MB."
    }), 413


if __name__ == "__main__":
    app.run(port=8000, debug=False)
