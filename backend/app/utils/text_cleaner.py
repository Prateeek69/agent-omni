import re


def clean_text(text: str) -> str:
    if not text:
        return ""

    # Basic normalization
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"\s+", " ", text)

    # Process word by word
    words = text.split()
    clean_words = []

    for word in words:
        # Ignore empty
        if not word.strip():
            continue

        # Count alphabet characters and total characters
        alpha_count = sum(c.isalpha() for c in word)
        total_count = len(word)

        # Reject words with >30% non-alphabet characters (unless it's a number/punctuation)
        if total_count > 0:
            non_alpha_ratio = (total_count - alpha_count) / total_count
            
            # Keep common words, numbers or small punctuation
            if total_count > 3 and non_alpha_ratio > 0.3 and not word.isnumeric() and not re.match(r"^[0-9.,\-]+$", word):
                continue
            
            # Reject broken words (like "PRA(EEK") if it has weird symbols
            if re.search(r"[(){}[\]<>@#$%^&*_=+|\\]", word) and alpha_count > 0:
                continue

        clean_words.append(word)

    clean_text = " ".join(clean_words).strip()
    return clean_text