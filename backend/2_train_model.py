# pyre-ignore-all-errors
import os
import cv2 # pyre-ignore
import numpy as np # pyre-ignore

# -------- SETTINGS --------
DATA_DIR = r"c:\Users\mishr\OneDrive\Desktop\dataset\train"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "lbph_model.yml")
IMG_SIZE = (48, 48)  # FER2013 standard size

def load_images_and_labels():
    faces = []
    labels = []
    class_names = []
    label_id: int = 0

    if not os.path.exists(DATA_DIR):
        print(f"❌ Error: {DATA_DIR} not found. Please run collect_data.py first.")
        return faces, np.array(labels), class_names

    for emotion in sorted(os.listdir(DATA_DIR)):
        emotion_dir = os.path.join(DATA_DIR, emotion)
        if not os.path.isdir(emotion_dir):
            continue
            
        class_names.append(emotion)
        print(f"Loading '{emotion}' images... (ID: {label_id})")
        
        loaded_count = 0
        for img_name in os.listdir(emotion_dir):
            if loaded_count >= 250:  # Limit images per emotion for GitHub size limits (under 100MB)
                break
                
            if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                img_path = os.path.join(emotion_dir, img_name)
                # Read as grayscale for LBPH
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    # Resize to uniform size
                    img = cv2.resize(img, IMG_SIZE)
                    faces.append(img)
                    labels.append(label_id)
                    loaded_count += 1
        label_id = label_id + 1  # pyre-ignore
        
    return faces, np.array(labels), class_names

def main():
    print("📂 Loading dataset (FER-2013 compatible)...")
    faces, labels, class_names = load_images_and_labels()
    
    if len(faces) == 0:
        print("❌ Error: No training data found.")
        return

    print(f"✅ Class names (label order): {class_names}")
    print(f"Loaded {len(faces)} total images.")
    
    print("\n🧠 Building LBPH Face Recognizer model for emotion detection...")
    recognizer = cv2.face.LBPHFaceRecognizer_create()

    print("\n🚀 Training model... (this can take a moment)")
    recognizer.train(faces, labels)

    os.makedirs(MODEL_DIR, exist_ok=True)
    print("\n💾 Saving model...")
    recognizer.write(MODEL_PATH)
    print(f"✅ Model saved at: {MODEL_PATH}")
    
    # Save class names to a text file
    classes_path = os.path.join(MODEL_DIR, "class_names.txt")
    with open(classes_path, "w") as f:
        f.write("\n".join(class_names))
    print(f"✅ Class names saved at: {classes_path}")

    print("\n📌 Class order (copy this for app.py):", class_names)

if __name__ == "__main__":
    main()
