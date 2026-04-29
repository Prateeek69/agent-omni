import re

_ALLOWED_PUNCTUATION = set(".,:/%-&()'\";?!#")
_DISALLOWED_TOKEN_PATTERN = re.compile(r"[{}\[\]<>@#$%^*_+=|\\]")
_NUMERIC_TOKEN_PATTERN = re.compile(r"^[0-9.,:/\-]+$")


def _clean_token(word: str) -> str:
    token = word.strip()
    if not token:
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

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[^\x00-\x7F]+", " ", normalized)

    segments = normalized.split("\n") if preserve_line_breaks else [normalized]
    cleaned_segments = []

    for raw_segment in segments:
        segment = re.sub(r"\s+", " ", raw_segment).strip()
        if not segment:
            if preserve_line_breaks and cleaned_segments and cleaned_segments[-1] != "":
                cleaned_segments.append("")
            continue

        tokens = [_clean_token(token) for token in segment.split(" ")]
        cleaned = " ".join(token for token in tokens if token).strip(" -")

        if not cleaned:
            if preserve_line_breaks and cleaned_segments and cleaned_segments[-1] != "":
                cleaned_segments.append("")
            continue

        cleaned_segments.append(cleaned)

    if preserve_line_breaks:
        result = "\n".join(cleaned_segments)
        result = re.sub(r"\n{3,}", "\n\n", result)
    else:
        result = " ".join(cleaned_segments)
        result = re.sub(r"\s+", " ", result)

    return result.strip()
