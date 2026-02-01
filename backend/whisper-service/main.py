"""
Whisper Speech-to-Text Service
本地语音识别服务，使用 faster-whisper 实现低延迟中文语音转文字
"""

import os
import tempfile
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局模型实例
whisper_model = None


class TranscriptionResult(BaseModel):
    text: str
    language: str
    duration: float
    segments: list[dict] = []


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str


def load_whisper_model():
    """加载 Whisper 模型"""
    global whisper_model

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        logger.error("faster-whisper not installed. Run: pip install faster-whisper")
        return None

    model_size = os.environ.get("WHISPER_MODEL", "small")
    device = os.environ.get("WHISPER_DEVICE", "cpu")
    compute_type = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

    # GPU 设置
    if device == "cuda":
        compute_type = os.environ.get("WHISPER_COMPUTE_TYPE", "float16")

    logger.info(f"Loading Whisper model: {model_size} on {device} with {compute_type}")

    try:
        whisper_model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
        )
        logger.info(f"Whisper model loaded successfully: {model_size}")
        return whisper_model
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时加载模型
    load_whisper_model()
    yield
    # 关闭时清理
    global whisper_model
    whisper_model = None


app = FastAPI(
    title="Whisper Speech-to-Text Service",
    description="本地语音识别服务，支持中文",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    model_name = os.environ.get("WHISPER_MODEL", "small")
    return HealthResponse(
        status="ok" if whisper_model else "model_not_loaded",
        model_loaded=whisper_model is not None,
        model_name=model_name,
    )


@app.post("/transcribe", response_model=TranscriptionResult)
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = "zh",
):
    """
    转录音频文件

    - audio: 音频文件 (支持 webm, wav, mp3, m4a 等格式)
    - language: 语言代码 (默认 zh 中文)
    """
    if whisper_model is None:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded. Please check server logs.",
        )

    # 获取文件扩展名
    filename = audio.filename or "audio.webm"
    ext = os.path.splitext(filename)[1] or ".webm"

    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        try:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read audio: {e}")

    try:
        # 转录
        segments_list, info = whisper_model.transcribe(
            tmp_path,
            language=language,
            beam_size=5,
            best_of=5,
            temperature=0,
            vad_filter=True,  # 启用 VAD 过滤静音
        )

        # 收集所有片段
        segments = []
        full_text = []
        for segment in segments_list:
            segments.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
            })
            full_text.append(segment.text.strip())

        text = "".join(full_text)

        logger.info(f"Transcribed: '{text[:50]}...' ({info.duration:.1f}s)")

        return TranscriptionResult(
            text=text,
            language=info.language,
            duration=info.duration,
            segments=segments,
        )
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        # 清理临时文件
        try:
            os.unlink(tmp_path)
        except:
            pass


@app.post("/transcribe-stream")
async def transcribe_stream(
    audio: UploadFile = File(...),
    language: Optional[str] = "zh",
):
    """
    流式转录（返回实时片段）
    用于实时显示识别结果
    """
    if whisper_model is None:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded",
        )

    filename = audio.filename or "audio.webm"
    ext = os.path.splitext(filename)[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        segments_list, info = whisper_model.transcribe(
            tmp_path,
            language=language,
            beam_size=3,
            best_of=3,
            temperature=0,
            vad_filter=True,
        )

        results = []
        for segment in segments_list:
            results.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
            })

        return {
            "segments": results,
            "language": info.language,
            "duration": info.duration,
        }
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("WHISPER_PORT", "8001"))
    host = os.environ.get("WHISPER_HOST", "0.0.0.0")

    uvicorn.run(app, host=host, port=port)
