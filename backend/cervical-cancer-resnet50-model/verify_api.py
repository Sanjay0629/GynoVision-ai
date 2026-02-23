import requests
import json

url = "http://localhost:5000/predict/cervical"
file_path = r"D:\gyno-vision-ai\backend\cervical-cancer-resnet50-model\models\test\Koilocytotic\003_01.bmp"

print(f"Testing prediction on: {file_path}")

try:
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to test API: {e}")
