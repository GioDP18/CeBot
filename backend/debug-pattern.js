// Debug the specific case of "How do I get from Carbon to Apas?"

const message = "How do I get from Carbon to Apas?";
const cleanMessage = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
console.log('Original:', message);
console.log('Clean:', cleanMessage);

const patterns = [
  /how do i get from\s+([^to]+?)\s+to\s+(.+?)(?:\?|$)/,
  /from\s+([^to]+?)\s+to\s+(.+?)(?:\?|$)/
];

patterns.forEach((pattern, index) => {
  const match = cleanMessage.match(pattern);
  console.log(`Pattern ${index + 1}:`, pattern);
  console.log('Match:', match);
  if (match) {
    console.log(`  Group 1: "${match[1]}"`);
    console.log(`  Group 2: "${match[2]}"`);
  }
  console.log('---');
});
