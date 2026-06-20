import os
import json
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

def stream_claude_response(prompt, system_instruction, history=None):
    """
    Streams the response from Claude API.
    If ANTHROPIC_API_KEY is not configured, falls back to Gemini or simulated stream.
    """
    api_key = current_app.config.get('ANTHROPIC_API_KEY')
    
    # 1. Try Claude if API key is present
    if api_key:
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            
            # Format messages
            messages = []
            if history:
                for msg in history:
                    messages.append({
                        "role": "user" if msg["role"] == "user" else "assistant",
                        "content": msg["content"]
                    })
            messages.append({"role": "user", "content": prompt})
            
            data = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1024,
                "system": system_instruction,
                "messages": messages,
                "stream": True
            }
            
            response = requests.post(url, headers=headers, json=data, stream=True)
            if response.status_code == 200:
                def generate():
                    for line in response.iter_lines():
                        if line:
                            decoded = line.decode('utf-8').strip()
                            if decoded.startswith("data:"):
                                try:
                                    payload = json.loads(decoded[5:].strip())
                                    if payload.get("type") == "content_block_delta":
                                        chunk = payload["delta"].get("text", "")
                                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                                except Exception:
                                    continue
                    yield "data: [DONE]\n\n"
                return generate()
            else:
                logger.error(f"Claude API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Claude: {str(e)}")

    # 2. Fall back to Gemini API if GEMINI_API_KEY is present
    gemini_key = current_app.config.get('GEMINI_API_KEY')
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=system_instruction
            )
            
            # If history is provided, build chat format
            chat_history = []
            if history:
                for msg in history:
                    chat_history.append({
                        "role": "user" if msg["role"] == "user" else "model",
                        "parts": [msg["content"]]
                    })
            
            chat = model.start_chat(history=chat_history)
            response = chat.send_message(prompt, stream=True)
            
            def generate_gemini():
                for chunk in response:
                    yield f"data: {json.dumps({'chunk': chunk.text})}\n\n"
                yield "data: [DONE]\n\n"
            return generate_gemini()
        except Exception as e:
            logger.error(f"Error calling Gemini fallback: {str(e)}")

    # 3. Local Smart Rule Engine Fallback
    def generate_fallback():
        import time
        message = (
            "Hi there! I'm your GreenTrack AI Advisor. Currently, I'm running in offline demo mode. "
            "Based on your footprint, here is how you can optimize: \n\n"
            "1. **Transportation**: Shifting to public transit or an EV can reduce emissions by up to 50%.\n"
            "2. **Energy**: Replace old bulbs with LED fixtures and unplug standby loads.\n"
            "3. **Diet**: Shifting to organic, plant-based options once a week saves ~100 kg CO2 annually.\n\n"
            "Configure an API key in the environment variables to unlock the fully conversational LLM experience!"
        )
        # Simulate typing/streaming
        for i in range(0, len(message), 15):
            chunk = message[i:i+15]
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            time.sleep(0.05)
        yield "data: [DONE]\n\n"
    
    return generate_fallback()
