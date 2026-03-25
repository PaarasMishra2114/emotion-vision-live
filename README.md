# Emotion Detection System

This repository contains an end-to-end Emotion Detection and Vision analysis system. It is designed to work in two modes:
1. **Real-time Camera Feed** - Continuously polling or manually capturing via webcam.
2. **Image Upload** - Analyzing static `.jpg`, `.jpeg`, or `.png` images.

---

## 1. Architecture Overview

### Frontend
- **Framework**: Built with [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
- **UI & Styling**: Styled using [Tailwind CSS](https://tailwindcss.com/) combined with [shadcn/ui](https://ui.shadcn.com/) components to create a futuristic, high-tech dashboard. 
- **Icons**: Uses [Lucide React](https://lucide.dev/guide/packages/lucide-react) for sharp, modern iconography.
- **Role**: Communicates with the backend using REST APIs, extracting frames dynamically from the webcam using `<canvas>`, and sending blobs to the `Flask` server for processing. 

### Backend
- **Framework**: A lightweight [Flask](https://flask.palletsprojects.com/en/3.0.x/) server.
- **Language**: Python 3.
- **Computer Vision**: Utilizes [OpenCV (cv2)](https://opencv.org/) for both handling the image arrays and running internal models.
- **Role**: Receives image data (via HTTP POST), runs face detection, predicts the emotion from the cropped face region, and sends back the JSON response that powers the frontend dashboard metrics.

---

## 2. Model & Algorithmic Details

This system does not rely on massive Deep Learning architectures (like CNNs or DeepFace) to ensure it stays lightweight, lightning-fast, and operable natively on CPU. 

### Face Detection: Haar Cascades
- **How it works**: Uses the highly efficient `haarcascade_frontalface_default.xml`, an object detection algorithm proposed by Paul Viola and Michael Jones.
- **Why it's used**: Extremely fast for real-time applications and reliably detects frontal faces. We run `detectMultiScale` to identify bounding boxes instantly.

### Emotion Recognition: Local Binary Patterns Histograms (LBPH)
- **How it works**: LBPH is a texture/pattern-based algorithm. It analyzes the specific local structure (eyebrows, mouth curve, wrinkles) of a grayscale face image, compiling a histogram of binary calculations.
- **Why it's used**: It is robust against lighting conditions and can easily be trained on your own datasets dynamically, taking mere seconds compared to hours for deep learning neural networks.

---

## 3. How to Train Your Own Data (Overfitting for perfect accuracy)

If you want the model to be highly accurate for your own face, we've provided scripts to easily train a custom model natively. 

### Step 1: Collect Data
Run the data collection script. We capture **50 photos per emotion** ("angry", "happy", "neutral", "sad").
```bash
python backend/1_collect_data.py
```
*Note*: Overfitting on your own face with 50 diverse photos per class practically guarantees near perfect detection!

### Step 2: Train Model
Once you have collected the images, run the training script:
```bash
python backend/2_train_model.py
```
This generates `lbph_model.yml` inside the `models/` directory, along with `class_names.txt`. The `app.py` script automatically utilizes this over-fitted data payload whenever it boots.

---

## 4. Suggested Kaggle Dataset (FER-2013)

If you wish to make the model powerful and generalized for everyone rather than overfitting to your own face, you should use the **FER-2013** dataset.
- [FER-2013 on Kaggle](https://www.kaggle.com/datasets/msambare/fer2013)
- Contains 35,000+ facial images categorized into 7 emotion groups.
- Our script is **already compatible** with FERC-2013 folder architectures. Extract the `train/` folder of that dataset straight into `backend/dataset/train`, run `python 2_train_model.py`, and you will have a robust, generalized AI model!

---

## 5. Running the Application

1. **Terminal 1: Start Backend**
   ```bash
   cd backend
   venv_11\Scripts\python app.py
   ```
   > Server spins up on `http://127.0.0.1:5000`

2. **Terminal 2: Start Frontend**
   ```bash
   npm run build
   npm run dev
   # OR
   npx vite dev
   ```
   > Dashboard loads at `http://localhost:8080/`

You are now in the command center. Click **START LIVE FEED** to stream data or **UPLOAD IMAGE** to analyze local files. Use the new **CAPTURE / SCAN** button in real-time UI mode to force-trigger immediate predictions.
