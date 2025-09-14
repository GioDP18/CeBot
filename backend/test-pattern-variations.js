// Test different approaches for the pattern

const cleanMessage = "how do i get from carbon to apas";
console.log('Clean:', cleanMessage);

const patterns = [
  { name: 'Pattern 1 - [^to]', regex: /how\s+do\s+i\s+get\s+from\s+([^to]+?)\s+to\s+(.+)/ },
  { name: 'Pattern 2 - ([^\\s]+)', regex: /how\s+do\s+i\s+get\s+from\s+([^\s]+)\s+to\s+(.+)/ },
  { name: 'Pattern 3 - (\\w+)', regex: /how\s+do\s+i\s+get\s+from\s+(\w+)\s+to\s+(.+)/ },
  { name: 'Pattern 4 - (.*?)', regex: /how\s+do\s+i\s+get\s+from\s+(.*?)\s+to\s+(.+)/ }
];

patterns.forEach(({ name, regex }) => {
  const match = cleanMessage.match(regex);
  console.log(`${name}:`, match ? `"${match[1]}" → "${match[2]}"` : 'No match');
});
