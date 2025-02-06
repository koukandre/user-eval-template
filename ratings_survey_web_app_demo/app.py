import os
import json
from datetime import datetime

# Flask imports
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__, static_url_path='/static')

# Create answers directory if it doesn't exist
ANSWERS_DIR = './answers'
if not os.path.exists(ANSWERS_DIR):
    os.makedirs(ANSWERS_DIR)

@app.route("/")
def index():
    # serve the main html document
    return render_template("index.html")

@app.route('/postmethod', methods=['POST'])
def postmethod():
    print("Incoming data from client... ")
    # Receive post request from client
    data = request.get_json()
    print(data)
    
    # Create filename using timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(ANSWERS_DIR, f'response_{timestamp}.json')
    
    # Save data to JSON file
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"Data saved to {filename}")
    
    # Return ack to client
    return jsonify("DONE")

if __name__ == "__main__":
    # localhost in port 1988 e.g. http://0.0.0.0:1988
    app.run(host='0.0.0.0', port=1988, debug=True)