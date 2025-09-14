// Test different regex patterns for route extraction

const messages = [
  'How do I get from Carbon to Apas?',
  'From Apas to Carbon',
  'Route from Carbon to Apas'
];

const patterns = [
  { name: 'Pattern 1', regex: /how do i get from\s+([^to]+?)\s+to\s+(.+?)(?:\?|$)/i },
  { name: 'Pattern 2', regex: /from\s+([^to]+?)\s+to\s+(.+?)(?:\?|$)/i },
  { name: 'Pattern 3', regex: /route from\s+([^to]+?)\s+to\s+(.+?)(?:\?|$)/i }
];

messages.forEach(message => {
  console.log(`\nTesting: "${message}"`);
  const cleanMessage = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`Clean: "${cleanMessage}"`);
  
  patterns.forEach(pattern => {
    const match = cleanMessage.match(pattern.regex);
    if (match) {
      console.log(`${pattern.name}: origin="${match[1]?.trim()}", destination="${match[2]?.trim()}"`);
    }
  });
});
