from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import numpy as np
import os
import traceback

app = Flask(__name__)

# Load the trained model
model = load_model('model/model.h5')

# Class labels used during training (39 classes matching model.h5 output shape)
class_labels = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___Healthy', 
    'Blueberry___Healthy', 'Cherry___Powdery_mildew', 'Cherry___Healthy', 
    'Corn___Cercospora_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight', 'Corn___Healthy', 
    'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___Healthy', 
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___Healthy', 
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___Healthy', 
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___Healthy', 
    'Raspberry___Healthy', 'Soybean___Healthy', 'Squash___Powdery_mildew', 
    'Strawberry___Leaf_scorch', 'Strawberry___Healthy', 
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites_Two_spotted_spider_mite', 
    'Tomato___Target_Spot', 'Tomato___Yellow_Leaf_Curl_Virus', 'Tomato___mosaic_virus', 'Tomato___Healthy', 
    'Background_without_leaves'
]

@app.route("/")
def index(): 
    return "Flask is working"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files['image']
        filepath = os.path.join('uploads', file.filename)
        file.save(filepath)

        # Load and preprocess the image
        img = Image.open(filepath).convert('RGB')
        img = img.resize((224, 224))  # depends on training size
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0) / 255.0  # normalize

        # Predict
        predictions = model.predict(img_array)
        class_index = int(np.argmax(predictions))
        confidence = float(np.max(predictions)) * 100
        
        if class_index < len(class_labels):
            predicted_class = class_labels[class_index]
        else:
            predicted_class = f"Plant___Disease_{class_index}"

        plant_name = predicted_class.split('___')[0]
        disease_name = predicted_class.split('___')[1] if '___' in predicted_class else 'Unknown'

        result = {
            "plant": plant_name,
            "disease": disease_name,
            "confidence": round(confidence, 2),
            "description": get_disease_description(disease_name),
            "treatment": get_treatment_recommendation(disease_name),
            "cause": get_disease_cause(disease_name),
            "precaution": get_disease_precaution(disease_name)
        }

        return jsonify(result)

    except Exception as e:
        # Log the full stack trace for debugging
        traceback.print_exc()
        print("Error while sending the response to node" , e)

        # Return JSON error response with details
        return jsonify({
            "error": "Prediction failed",
            "message": str(e)
        }), 500

def get_disease_description(disease):
    descriptions = {
        "Leaf_Mold": "Fungal disease causing yellowish spots on older leaves.",
        "Late_blight": "Destroys leaves and stems, causing large dark blotches.",
        "Healthy": "No visible symptoms detected. Plant appears healthy.",
        "Early_blight": "Brown spots with concentric rings and yellow halos.",
        "Yellow_Leaf_Curl_Virus": "Viral disease causing yellow curling of leaves.",
    }
    return descriptions.get(disease, "No description available for this disease.")

def get_treatment_recommendation(disease):
    treatments = {
        "Leaf_Mold": "Use fungicides like mancozeb. Improve air circulation.",
        "Late_blight": "Apply copper-based fungicides. Remove affected parts.",
        "Healthy": "No treatment needed. Maintain plant care.",
        "Early_blight": "Apply chlorothalonil or mancozeb-based fungicides.",
        "Yellow_Leaf_Curl_Virus": "Control whiteflies. Remove infected plants.",
    }
    return treatments.get(disease, "No treatment recommendation available.")

def get_disease_cause(disease):
    causes = {
        "Leaf_Mold": "Caused by the fungus Passalora fulva, thriving in high humidity.",
        "Late_blight": "Caused by the oomycete Phytophthora infestans.",
        "Healthy": "No pathogen detected.",
        "Early_blight": "Caused by the fungus Alternaria solani.",
        "Yellow_Leaf_Curl_Virus": "Caused by a Begomovirus, transmitted by whiteflies.",
    }
    return causes.get(disease, "Environmental or unknown biological factors.")

def get_disease_precaution(disease):
    precautions = {
        "Leaf_Mold": "Increase greenhouse ventilation and avoid overhead watering.",
        "Late_blight": "Use resistant varieties and ensure proper plant spacing.",
        "Healthy": "Continue regular monitoring and balanced fertilization.",
        "Early_blight": "Rotate crops and remove plant debris after harvest.",
        "Yellow_Leaf_Curl_Virus": "Use reflective mulches and fine mesh screening.",
    }
    return precautions.get(disease, "Isolate plant and sanitize tools.")

if __name__ == '__main__':
    os.makedirs('uploads', exist_ok=True)
    app.run(port=8000, debug=True)
