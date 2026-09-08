import cv2
import numpy as np
import soundfile as sf
import io
from app.services.face_service import FaceEmotionService
from app.services.audio_service import AudioEmotionService

def test_media():
    print(">>> Testing OpenCV Face Service with synthetic face-like canvas...")
    # Create an image with a simple oval face and features
    img = np.ones((400, 400, 3), dtype=np.uint8) * 230
    # Draw an ellipse face
    cv2.ellipse(img, (200, 200), (90, 120), 0, 0, 360, (180, 180, 180), -1)
    # Eyes
    cv2.circle(img, (165, 170), 12, (50, 50, 50), -1)
    cv2.circle(img, (235, 170), 12, (50, 50, 50), -1)
    # Smile
    cv2.ellipse(img, (200, 240), (45, 25), 0, 0, 180, (40, 40, 40), 3)

    _, encoded = cv2.imencode(".jpg", img)
    face_service = FaceEmotionService()
    face_res = face_service.analyze_image_bytes(encoded.tobytes())
    print(f"Face Result -> detected: {face_res.face_detected}, emotion: {face_res.emotion}, conf: {face_res.confidence:.2f}")

    print(">>> Testing Audio Service with synthetic speech harmonic tone...")
    sr = 16000
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    # Generate modulated audio signal
    audio_wave = 0.4 * np.sin(2 * np.pi * 220 * t) + 0.2 * np.sin(2 * np.pi * 440 * t)
    bio = io.BytesIO()
    sf.write(bio, audio_wave, sr, format="WAV")
    audio_bytes = bio.getvalue()

    audio_service = AudioEmotionService()
    audio_res = audio_service.analyze_audio_bytes(audio_bytes)
    print(f"Audio Result -> emotion: {audio_res.emotion}, conf: {audio_res.confidence:.2f}, waveform points: {len(audio_res.waveform_points)}")
    assert len(audio_res.waveform_points) > 0
    print("MEDIA PROCESSING TESTS PASSED!")

if __name__ == "__main__":
    test_media()
