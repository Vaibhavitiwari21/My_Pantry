import unittest
import json
from backend import app  # Ensure you import your Flask app
from transformers import pipeline

class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        # Set up the test client
        self.app = app.test_client()
        self.app.testing = True

    def test_generate_recipe_success(self):
        # Ensure the model is loaded correctly
        with self.app as client:
            response = client.post('/generate_recipe', data=json.dumps({
                'ingredients': 'tomato, potato, onion'
            }), content_type='application/json')
            data = json.loads(response.data)
            self.assertEqual(response.status_code, 200)
            self.assertIn('recipe', data)
            print("Success test response:", data)

    def test_generate_recipe_no_ingredients(self):
        # Test with no ingredients provided
        with self.app as client:
            response = client.post('/generate_recipe', data=json.dumps({}), content_type='application/json')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data['error'], 'Ingredients not provided.')
            print("No ingredients test response:", data)

    def test_generate_recipe_model_unavailable(self):
        # Simulate the case where the model is not available
        with self.app as client:
            with self.app.application.app_context():
                app.recipe_generator = None  # Temporarily set the model to None
            response = client.post('/generate_recipe', data=json.dumps({
                'ingredients': 'tomato, potato, onion'
            }), content_type='application/json')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertEqual(data['error'], 'Recipe generator model is not available.')
            print("Model unavailable test response:", data)
            app.recipe_generator = pipeline("text-generation", model="KVM1L/recipe-gpt-bloom-7b1")  # Restore the model

if __name__ == '__main__':
    unittest.main()
