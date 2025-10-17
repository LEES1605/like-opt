#!/usr/bin/env python3
"""
Simple Flask test app to debug the issue
"""

from flask import Flask
from pathlib import Path

# Create a simple Flask app
app = Flask(
    __name__,
    static_folder=str(Path(__file__).parent / 'app' / 'static'),
    template_folder=str(Path(__file__).parent / 'app' / 'templates')
)

@app.route('/')
def index():
    """Test route"""
    return "Flask app is working!"

@app.route('/static/<path:filename>')
def static_files(filename):
    """Static files"""
    return app.send_static_file(filename)

@app.route('/medal-demo')
def medal_demo():
    """Medal demo"""
    return app.send_static_file('medal-demo.html')

if __name__ == '__main__':
    print("Starting simple Flask app...")
    print(f"Static folder: {app.static_folder}")
    app.run(host='127.0.0.1', port=5001, debug=True)
