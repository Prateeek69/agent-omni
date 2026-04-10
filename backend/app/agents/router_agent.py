def route_request(normalized_data: dict) -> dict:
    """
    Decide which agents to use based on input types.
    """

    required_agents = set()

    for item in normalized_data.get("inputs", []):
        input_type = item.get("type")

        if input_type in ["image", "pdf"]:
            required_agents.add("ocr")

        elif input_type == "audio":
            required_agents.add("audio")

        elif input_type == "text":
            required_agents.add("reasoning")

    # Always include reasoning at the end
    required_agents.add("reasoning")

    return {
        "intent": "process_input",
        "agents": list(required_agents)
    }