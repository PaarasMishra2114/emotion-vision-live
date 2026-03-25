# pyre-ignore-all-errors
import cv2 # pyre-ignore
import os
import uuid
import numpy as np # pyre-ignore

# -------- SETTINGS --------
EMOTIONS = ["angry", "happy", "neutral", "sad"]
SAVE_DIR = "dataset/train"
IMG_SIZE = 224
IMAGES_PER_EMOTION = 50  # how many images to capture per emotion

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def create_folders():
    os.makedirs(SAVE_DIR, exist_ok=True)
    for emotion in EMOTIONS:
        path = os.path.join(SAVE_DIR, emotion)
        os.makedirs(path, exist_ok=True)


def main():
    create_folders()
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Error: Could not open webcam.")
        return

    for emotion in EMOTIONS:
        count: int = 0
        print(f"\n>>> SHOW EMOTION: {emotion.upper()}")
        print("Look at the camera. Press 'c' to capture, 'q' to skip this emotion.\n")

        while count < IMAGES_PER_EMOTION:
            ret, frame = cap.read()
            if not ret:
                print("❌ Error: Failed to read frame from webcam.")
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            face_img = None

            if len(faces) > 0:
                # just take the first face
                (x, y, w, h) = faces[0]
                face_img = gray[y:y+h, x:x+w]
                face_img = cv2.resize(face_img, (IMG_SIZE, IMG_SIZE))

                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

            cv2.putText(
                frame,
                f"{emotion} {count}/{IMAGES_PER_EMOTION}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )

            cv2.imshow("Capture Emotion Data (press 'c' to save)", frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord("c"):
                if face_img is not None:
                    filename = f"{emotion}_{uuid.uuid4().hex}.jpg"
                    save_path = os.path.join(SAVE_DIR, emotion, filename)
                    cv2.imwrite(save_path, face_img)
                    count = count + 1  # pyre-ignore
                    print(f"✅ Saved {save_path}")
                else:
                    print("⚠ No face detected. Try again.")

            if key == ord("q"):
                print(f"Skipping emotion: {emotion}")
                break

    cap.release()
    cv2.destroyAllWindows()
    print("\n🎉 Data collection complete!")


if __name__ == "__main__":
    main()
