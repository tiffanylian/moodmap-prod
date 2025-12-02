{
  "name": "MoodEntry",
  "type": "object",
  "properties": {
    "emotion": {
      "type": "string",
      "enum": [
        "stressed",
        "tired",
        "vibes",
        "hyped",
        "mid"
      ],
      "description": "The emotion selected"
    },
    "notes": {
      "type": "string",
      "description": "Optional notes about how they're feeling"
    },
    "emoji": {
      "type": "string",
      "description": "The emoji representing the mood"
    }
  },
  "required": [
    "emotion"
  ]
}
