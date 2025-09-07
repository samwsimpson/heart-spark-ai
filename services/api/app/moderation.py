from __future__ import annotations

# Tiny, placeholder moderation. Replace with Vertex/OpenAI/your model later.
BAD_WORDS = {"slur1", "slur2"}  # <-- fill with your blocklist

def is_allowed(text: str) -> bool:
    t = (text or "").lower()
    if not t.strip():
        return False
    if any(b in t for b in BAD_WORDS):
        return False
    # Add simple guards (length, spammy repeats, etc.)
    if len(t) > 2000:
        return False
    return True
