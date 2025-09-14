// Test the correct pattern

const message = "How do I get from Carbon to Apas?";
const cleanMessage = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
console.log('Clean:', cleanMessage);

// The correct pattern for "how do i get from X to Y"
const correctPattern = /how\s+do\s+i\s+get\s+from\s+([^to]+?)\s+to\s+(.+)/;
const match = cleanMessage.match(correctPattern);

console.log('Pattern:', correctPattern);
console.log('Match:', match);
if (match) {
  console.log(`  Origin: "${match[1].trim()}"`);
  console.log(`  Destination: "${match[2].trim()}"`);
}
