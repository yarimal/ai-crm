"""
Gemini Text-to-Speech Service
EXACT copy of working test script approach
"""
from google import genai
from google.genai import types
import wave
import os
import datetime
import uuid
from typing import Optional


class TTSService:
    """Service for Gemini Text-to-Speech"""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def _clean_text_for_speech(self, text: str) -> str:
        """
        Clean text before sending to TTS to remove UUIDs and other non-speakable content
        """
        import re
        
        # Remove UUIDs in brackets: [ID: abc-123-def-456]
        text = re.sub(r'\[ID:\s*[a-f0-9\-]+\]', '', text, flags=re.IGNORECASE)

        # Remove extra whitespace created by removal
        text = re.sub(r'\s+', ' ', text)

        # Remove markdown-style bold/italic markers
        text = text.replace('**', '').replace('__', '').replace('*', '').replace('_', '').replace('•','')

        return text.strip()

    def generate_speech(self, text: str, voice: Optional[str] = None) -> Optional[dict]:
        """
        Generate speech from text using Gemini TTS
        EXACTLY like the test script that works!
        """
        if not self.client:
            print("TTS: No client available (check GEMINI_API_KEY)")
            return None

        try:
            # Clean text before TTS (remove UUIDs, markdown, etc.)
            clean_text = self._clean_text_for_speech(text)

            print(f"TTS: Generating audio for: {clean_text[:100]}...")

            # Generate with TTS
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=clean_text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice or 'Kore',
                            )
                        )
                    ),
                )
            )

            # CRITICAL FIX: inline_data.data is BASE64 encoded, not raw PCM!
            import base64
            encoded_data = response.candidates[0].content.parts[0].inline_data.data
            pcm_data = base64.b64decode(encoded_data)

            print(f"TTS: Received {len(pcm_data)} bytes of PCM audio")
            # Create WAV file in memory - EXACTLY like test script's wave_file()
            import io
            wav_buffer = io.BytesIO()
             
            with wave.open(wav_buffer, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(pcm_data)

            # Get WAV bytes
            wav_bytes = wav_buffer.getvalue()
            print(f"TTS: Created {len(wav_bytes)} bytes WAV file")

            # Convert to base64 for sending to browser
            wav_base64 = base64.b64encode(wav_bytes).decode('utf-8')

            return {
                "audio_data": wav_base64,
                "mime_type": "audio/wav"
            }

        except Exception as e:
            print(f"TTS error: {e}")
            import traceback
            traceback.print_exc()
            return None
