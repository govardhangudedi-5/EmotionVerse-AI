import sys
from app.main import app
from app.schemas.emotion import ContextMode, MultimodalFusionRequest, TextAnalysisRequest
from app.services.text_service import TextEmotionService
from app.services.fusion_service import MultimodalFusionService
from app.database.session import init_db, SessionLocal
from app.database.models import UserSession, EmotionAnalysis

def main():
    print(">>> 1. Testing Database Initialization...")
    init_db()
    print("Database OK.")

    print(">>> 2. Testing Text Emotion Service...")
    text_service = TextEmotionService()
    text_res = text_service.analyze_text("I am feeling very happy and excited about learning AI!")
    print(f"Text Emotion: {text_res.emotion}, Confidence: {text_res.confidence:.2f}, Mood: {text_res.mood_category}")
    assert text_res.emotion == "happy", f"Expected happy, got {text_res.emotion}"

    stress_res = text_service.analyze_text("I am very stressed and worried about my exam deadlines.")
    print(f"Stress Emotion: {stress_res.emotion}, Confidence: {stress_res.confidence:.2f}, Mood: {stress_res.mood_category}")
    assert stress_res.emotion in ["fear", "sad", "angry"], f"Expected negative emotion, got {stress_res.emotion}"

    print(">>> 3. Testing Multimodal Late Fusion...")
    fusion_service = MultimodalFusionService()
    fusion_req = MultimodalFusionRequest(
        text_result=text_res,
        context_mode=ContextMode.EDUCATION
    )
    fusion_res = fusion_service.fuse_modalities(fusion_req)
    print(f"Final Emotion: {fusion_res.final_emotion}, Confidence: {fusion_res.confidence:.2f}")
    print(f"Engagement: {fusion_res.engagement_level}, Mood: {fusion_res.mood_category}")
    print(f"Recommendations count: {len(fusion_res.recommendations)}")
    assert len(fusion_res.recommendations) > 0

    print(">>> 4. Testing Healthcare Mode Recommendations...")
    health_req = MultimodalFusionRequest(
        text_result=stress_res,
        context_mode=ContextMode.HEALTHCARE
    )
    health_res = fusion_service.fuse_modalities(health_req)
    print(f"Healthcare Final Emotion: {health_res.final_emotion}")
    print(f"Healthcare Recommendations: {[r.title for r in health_res.recommendations]}")
    assert "EmotionVerse AI provides supportive insights only and is not a medical diagnostic system." in health_res.medical_disclaimer

    print("ALL BACKEND PIPELINE UNIT TESTS PASSED!")

if __name__ == "__main__":
    main()
