from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
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
    audio_service: AudioEmotionService = Depends(get_audio_service),
):
    """
    Accepts audio file (WAV, MP3, WEBM, OGG) recorded in browser or uploaded.
    """
    try:
        content = await file.read()
        return audio_service.analyze_audio_bytes(content)
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
