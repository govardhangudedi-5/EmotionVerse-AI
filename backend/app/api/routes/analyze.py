from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError

from ...schemas.emotion import (
    AudioAnalysisResponse,
    FaceAnalysisRequest,
    FaceAnalysisResponse,
    MultimodalFusionRequest,
    MultimodalFusionResponse,
    TextAnalysisRequest,
    TextAnalysisResponse,
)
from ..dependencies import (
    get_audio_service,
    get_face_service,
    get_fusion_service,
    get_text_service,
)
from ...services.audio_service import AudioEmotionService
from ...services.face_service import FaceEmotionService
from ...services.fusion_service import MultimodalFusionService
from ...services.text_service import TextEmotionService

router = APIRouter(prefix="/analyze", tags=["Emotion Analysis"])


@router.post(
    "/face",
    response_model=FaceAnalysisResponse,
    summary="Analyze facial emotion from image file or base64 snapshot",
)
async def analyze_face_upload(
    file: Optional[UploadFile] = File(None),
    face_service: FaceEmotionService = Depends(get_face_service),
):
    """
    Accepts an uploaded image file (JPEG/PNG/WEBP) from file input.
    """
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required for multipart upload. Or use /face-base64 for webcam snapshots.",
        )

    try:
        content = await file.read()
        return face_service.analyze_image_bytes(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process facial image: {str(e)}",
        )


@router.post(
    "/face-base64",
    response_model=FaceAnalysisResponse,
    summary="Analyze facial emotion from webcam base64 frame",
)
async def analyze_face_base64(
    payload: FaceAnalysisRequest,
    face_service: FaceEmotionService = Depends(get_face_service),
):
    """
    Accepts a base64 encoded data URI frame from live webcam feed.
    """
    if not payload.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_base64 string is required",
        )
    return face_service.analyze_base64(payload.image_base64)


@router.post(
    "/audio",
    response_model=AudioAnalysisResponse,
    summary="Analyze voice emotion from recorded or uploaded audio file",
)
async def analyze_audio(
    file: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    mode: Optional[str] = Form("combined"),
    audio_service: AudioEmotionService = Depends(get_audio_service),
):
    """
    Accepts audio file (WAV, MP3, WEBM, OGG) recorded in browser or uploaded,
    with optional speech-to-text transcript and analysis mode.
    """
    try:
        content = await file.read()
        return audio_service.analyze_audio_bytes(
            content,
            transcript=transcript,
            analysis_mode=mode or "combined",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process audio file: {str(e)}",
        )


@router.post(
    "/text",
    response_model=TextAnalysisResponse,
    summary="Analyze text emotion from user message",
)
async def analyze_text(
    payload: TextAnalysisRequest,
    text_service: TextEmotionService = Depends(get_text_service),
):
    """
    Analyzes emotional sentiment of a user-entered text sentence or paragraph.
    """
    try:
        return text_service.analyze_text(payload.text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process text input: {str(e)}",
        )


@router.post(
    "/fusion",
    response_model=MultimodalFusionResponse,
    summary="Execute multimodal late fusion across face, voice, and text",
)
async def analyze_fusion(
    payload: MultimodalFusionRequest,
    fusion_service: MultimodalFusionService = Depends(get_fusion_service),
):
    """
    Combines outputs from whatever modalities (1, 2, or 3) are provided.
    Performs late fusion with dynamic weight normalization, agreement scoring,
    mixed emotion detection, and generates personalized recommendations.
    """
    try:
        return fusion_service.fuse_modalities(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multimodal fusion calculation failed: {str(e)}",
        )


# ==============================================================================
# Aliases conforming to Section 35 specification (/api/analyze-face, etc.)
# ==============================================================================

direct_alias_router = APIRouter(tags=["Emotion Analysis (Direct Specification)"])


@direct_alias_router.post(
    "/analyze-face",
    response_model=FaceAnalysisResponse,
    summary="Direct endpoint for real-time facial emotion analysis (Base64 JSON)",
)
async def analyze_face_direct(
    payload: FaceAnalysisRequest,
    face_service: FaceEmotionService = Depends(get_face_service),
):
    """Accepts base64 encoded video frame for live facial emotion inference."""
    if not payload.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="image_base64 is required for /analyze-face",
        )
    return face_service.analyze_base64(payload.image_base64)


@direct_alias_router.post(
    "/analyze-text",
    response_model=TextAnalysisResponse,
    summary="Direct endpoint for text emotion NLP analysis",
)
async def analyze_text_direct(
    payload: TextAnalysisRequest,
    text_service: TextEmotionService = Depends(get_text_service),
):
    """Analyzes text for emotional valence and 7-emotion probability distribution."""
    return text_service.analyze_text(payload.text)


@direct_alias_router.post(
    "/analyze-voice",
    response_model=AudioAnalysisResponse,
    summary="Direct endpoint for acoustic voice emotion analysis",
)
async def analyze_voice_direct(
    file: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    mode: Optional[str] = Form("combined"),
    audio_service: AudioEmotionService = Depends(get_audio_service),
):
    """Analyzes uploaded or recorded audio bytes with optional speech transcript."""
    content = await file.read()
    return audio_service.analyze_audio_bytes(
        content,
        transcript=transcript,
        analysis_mode=mode or "combined",
    )


@direct_alias_router.post(
    "/fuse-emotions",
    response_model=MultimodalFusionResponse,
    summary="Direct endpoint for decision-level late fusion",
)
async def fuse_emotions_direct(
    payload: MultimodalFusionRequest,
    fusion_service: MultimodalFusionService = Depends(get_fusion_service),
):
    """Executes late fusion combining active modalities with dynamic weight normalization."""
    return fusion_service.fuse_modalities(payload)
