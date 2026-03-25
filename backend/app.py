# pyre-ignore-all-errors
import os
import cv2 # pyre-ignore
import numpy as np # pyre-ignore
from flask import Flask, render_template, Response, jsonify # pyre-ignore
import threading

app = Flask(__name__)

# Core Model Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "lbph_model.yml")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "models", "class_names.txt")
CASC_PATH = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")
IMG_SIZE = (48, 48)

# Global variables to pass state between video loop and API endpoint
current_emotion = "UNKNOWN"
current_confidence = 0.0
lock = threading.Lock()

def load_face_detector():
    if os.path.exists(CASC_PATH):
        cascade_path = CASC_PATH
    else:
        cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        print(f"❌ Error loading Haar Cascade from {cascade_path}")
        return None
    return face_cascade

def load_emotion_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(CLASS_NAMES_PATH):
        print("❌ Error: Model or class names file not found. Train first!")
        return None, []
        
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_PATH)

    with open(CLASS_NAMES_PATH, "r") as f:
        class_names = [line.strip() for line in f.readlines()]
        
    return recognizer, class_names

# Initialization
face_cascade = load_face_detector()
recognizer, class_names = load_emotion_model()

def generate_frames():
    global current_emotion, current_confidence
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Cannot configure video camera")
        return

    while True:
        success, frame = cap.read()
        if not success:
            break
            
        # Analyze Frame
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = []
        if face_cascade is not None:
            # Lowered minNeighbors to 3 for higher sensitivity as requested
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))

        detected_emotion = "UNKNOWN"
        detected_confidence = 0.0
        
        if len(faces) > 0:
            print(f"DEBUG: Found {len(faces)} face(s) for live analysis.")

        for (x, y, w, h) in faces:
            # Draw bounding box but sci-fi style (Alien Orange Box)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 69, 255), 2)  # BGR layout for Orange (255, 69, 0 -> 0, 69, 255)
            
            # Predict emotion
            face_roi_gray = gray[y:y+h, x:x+w]
            face_roi_resized = cv2.resize(face_roi_gray, IMG_SIZE)
            
            if recognizer and class_names:
                label_id, conf = recognizer.predict(face_roi_resized)
                
                # Lower conf means better match in LBPH
                # Convert LBPH distance (conf) to a 0-100 percentage
                # ~0 equals perfect, ~100-150 equals bad. Let's cap max distance at 150 for 0%.
                max_distance = 150.0
                mapped_confidence = 100 - min(100, (conf / max_distance) * 100)
                
                detected_emotion = class_names[label_id]
                detected_confidence = mapped_confidence
                
                text = f"{detected_emotion.upper()} {mapped_confidence:.1f}%"
                cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 69, 255), 2, cv2.LINE_AA)

        with lock:
            current_emotion = detected_emotion
            current_confidence = detected_confidence

        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()

# Unused HTML routes removed as this is now a pure API

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/analyze_image', methods=['POST', 'OPTIONS'])
def analyze_image():
    from flask import request # pyre-ignore
    if request.method == 'OPTIONS':
        res = jsonify({})
        res.headers.add('Access-Control-Allow-Origin', '*')
        res.headers.add('Access-Control-Allow-Headers', '*')
        res.headers.add('Access-Control-Allow-Methods', '*')
        return res
        
    if 'image' not in request.files:
        error_res = jsonify({"error": "No image uploaded"})
        error_res.headers.add('Access-Control-Allow-Origin', '*')
        return error_res, 400
        
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    
    if frame is None:
        error_res = jsonify({"error": "Invalid image file"})
        error_res.headers.add('Access-Control-Allow-Origin', '*')
        return error_res, 400
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = []
    if face_cascade is not None:
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))
        print(f"🔍 analyze_image API: Detected {len(faces)} faces")
    
    detected_emotion = "UNKNOWN"
    detected_confidence = 0.0
    detected_bbox = None
    
    for (x, y, w, h) in faces:
        face_roi = gray[y:y+h, x:x+w]
        face_roi_resized = cv2.resize(face_roi, IMG_SIZE)
        
        if recognizer and class_names:
            label_id, conf = recognizer.predict(face_roi_resized)
            max_distance = 150.0
            mapped_confidence = 100 - min(100, (conf / max_distance) * 100)
            
            detected_emotion = class_names[label_id]
            detected_confidence = mapped_confidence
            detected_bbox = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
            break # Just analyze the first face found
            
    res = jsonify({"emotion": detected_emotion, "confidence": detected_confidence, "bbox": detected_bbox})
    res.headers.add('Access-Control-Allow-Origin', '*')
    return res

@app.route('/')
def home():
    res = jsonify({"message": "Emotion API Backend is running perfectly!", "status": "online"})
    res.headers.add('Access-Control-Allow-Origin', '*')
    return res

@app.route('/get_emotion_data')
def get_emotion_data():
    with lock:
        res = jsonify({"emotion": current_emotion, "confidence": current_confidence})
        res.headers.add('Access-Control-Allow-Origin', '*')
        return res

if __name__ == "__main__":
    app.run(debug=True, threaded=True, host="0.0.0.0", port=5000)
