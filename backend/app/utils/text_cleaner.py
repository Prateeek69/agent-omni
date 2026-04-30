import re

_ALLOWED_PUNCTUATION = set(".,:/%-&()'\";?!#")
_DISALLOWED_TOKEN_PATTERN = re.compile(r"[{}\[\]<>@#$%^*_+=|\\]")
_NUMERIC_TOKEN_PATTERN = re.compile(r"^[0-9.,:/\-]+$")


def _clean_token(word: str) -> str:
    token = word.strip()
    if not token:
        return ""

    # Remove sequences like "e e e", "BR a Se" (sparse characters)
    if len(token) == 1 and not token.isalnum():
        return ""

    alpha_count = sum(c.isalpha() for c in token)
    alnum_count = sum(c.isalnum() for c in token)

    if _DISALLOWED_TOKEN_PATTERN.search(token) and alpha_count > 0:
        return ""

    if len(token) > 4 and alnum_count == 0:
        return ""

    weird_count = sum(
        not (c.isalnum() or c in _ALLOWED_PUNCTUATION)
        for c in token
    )
    if (
        len(token) > 3
        and weird_count / max(len(token), 1) > 0.35
        and not _NUMERIC_TOKEN_PATTERN.match(token)
    ):
        return ""

    return token


def clean_text(text: str, preserve_line_breaks: bool = False) -> str:
    if not text:
        return ""

    # Normalize line breaks and spacing
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[^\x00-\x7F]+", " ", normalized)
    
    # Remove junk sequences like "e e e" (single letters separated by spaces)
    normalized = re.sub(r"\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\b", r"\1\2\3", normalized)
    normalized = re.sub(r"\b([a-zA-Z])\s+([a-zA-Z])\b", r"\1\2", normalized)

    lines = normalized.split("\n")
    processed_lines = []
    
    for i in range(len(lines)):
        line = re.sub(r"\s+", " ", lines[i]).strip()
        if not line:
            continue
            
        # If line ends without punctuation and there's a next line, merge them
        if i < len(lines) - 1:
            next_line = lines[i+1].strip()
            if next_line and not re.search(r'[.!?]$', line):
                # Check if it's likely a title/header (short)
                if len(line.split()) > 3:
                    lines[i+1] = line + " " + next_line
                    continue
        
        # Clean tokens in the line
        tokens = [_clean_token(token) for token in line.split(" ")]
        cleaned = " ".join(token for token in tokens if token).strip(" -")
        
        if cleaned:
            processed_lines.append(cleaned)

    if preserve_line_breaks:
        result = "\n".join(processed_lines)
        result = re.sub(r"\n{3,}", "\n\n", result)
    else:
        result = " ".join(processed_lines)
        result = re.sub(r"\s+", " ", result)

    return result.strip()

