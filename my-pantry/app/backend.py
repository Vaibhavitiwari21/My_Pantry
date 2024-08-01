import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from huggingface_hub import login
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Securely get the Hugging Face token from the environment
huggingface_token = os.getenv('HF_TOKEN')
if huggingface_token:
    login(token=huggingface_token)

# Load Hugging Face food recipe model pipeline
try:
    model_name = "flax-community/t5-recipe-generation"
    recipe_generator = pipeline("text2text-generation", model=model_name)
except Exception as e:
    print(f"Error loading model: {e}")
    recipe_generator = None

@app.route('/generate_recipe', methods=['POST'])
def generate_recipe():
    data = request.json
    print("Hello")
    ingredients = data.get('ingredients')
    if not ingredients:
        return jsonify({"error": "Ingredients not provided."}), 500
    if recipe_generator:
        try:
            response = recipe_generator(f"Generate a recipe using the following ingredients: {ingredients}")
            return jsonify({"recipe": response[0]['generated_text']})
        except Exception as e:
            print(f"Error generating recipe: {e}")
            return jsonify({"error": "Error generating recipe"}), 500
    else:
        return jsonify({"error": "Recipe generator model is not available."}), 500

if __name__ == '__main__':
    app.run(debug=True)
