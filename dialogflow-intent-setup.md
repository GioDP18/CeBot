# Dialogflow Intent Setup Guide

## Intent 1: route_lookup

**Intent Name**: `route_lookup`

**Training Phrases** (add these exact phrases):
```
How do I get from Apas to Fuente?
What jeepney should I ride from Apas to Fuente?
Route from Apas to Fuente
How to go from Apas to Fuente
Directions from Apas to Fuente
What's the best way to get from Apas to Fuente?
How do I get from Ayala to SM?
What jeepney should I ride from Ayala to SM?
Route from Ayala to SM
How to go from Ayala to SM
Directions from Ayala to SM
What's the best way to get from Ayala to SM?
How do I get from Colon to Carbon?
What jeepney should I ride from Colon to Carbon?
Route from Colon to Carbon
How to go from Colon to Carbon
Directions from Colon to Carbon
What's the best way to get from Colon to Carbon?
```

**Parameters**:
- `origin` (Required)
- `destination` (Required)

**Responses**:
```
I'll help you find the best route from {origin} to {destination}. Let me search for available jeepney routes.
```

## Intent 2: route_code_lookup

**Intent Name**: `route_code_lookup`

**Training Phrases**:
```
What is route 17B?
Tell me about route 17B
Route 17B information
What does route 17B cover?
Show me route 17B
Details for route 17B
What is route 12A?
Tell me about route 12A
Route 12A information
What does route 12A cover?
Show me route 12A
Details for route 12A
What is route 04C?
Tell me about route 04C
Route 04C information
What does route 04C cover?
Show me route 04C
Details for route 04C
```

**Parameters**:
- `route_code` (Required)

**Responses**:
```
Let me get you information about route {route_code}. This route covers...
```

## Intent 3: general_help

**Intent Name**: `general_help`

**Training Phrases**:
```
Help
What can you do?
Transport information
How does this work?
What are my options?
I need assistance
Can you help me?
What services do you offer?
How can you help me?
What transport options are available?
```

**Responses**:
```
I'm CeBot, your Cebu transport assistant! I can help you with:
• Finding jeepney routes between locations
• Getting information about specific route codes
• Providing transport directions

Just ask me something like "How do I get from Apas to Fuente?" or "What is route 17B?"
```

## Intent 4: Default Fallback Intent

**Intent Name**: `Default Fallback Intent`

**Check the "Fallback" checkbox**

**Responses**:
```
I'm sorry, I didn't understand that. I can help you with:
• Finding routes between locations (e.g., "How do I get from Apas to Fuente?")
• Route information (e.g., "What is route 17B?")
• General transport help

Could you please rephrase your question?
```

## Important Steps After Creating Intents:

1. **Train Your Agent**
   - After adding all intents, click "Train" in the top right
   - Wait for training to complete

2. **Test Each Intent**
   - Use the test console on the right side
   - Try: "How do I get from Apas to Fuente?"
   - Try: "What is route 17B?"
   - Try: "Help"

3. **Check Intent Detection**
   - Make sure each query matches the correct intent
   - Verify parameters are extracted correctly

## Common Issues and Solutions:

1. **Intent not recognized**: Add more training phrases that match actual user input
2. **Parameters not extracted**: Make sure parameters are properly configured
3. **Wrong intent matched**: Adjust training phrases to be more specific
4. **Fallback triggered**: Ensure training phrases cover common variations

## Testing Your Setup:

After setting up the intents, run this test query in Dialogflow:
- "How do I get from Apas to Fuente?"
- Should match: `route_lookup`
- Should extract: origin="Apas", destination="Fuente"

If this doesn't work, your training phrases need adjustment.
