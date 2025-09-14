// Debug step by step

const message = "How do I get from Carbon to Apas?";
const cleanMessage = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
console.log('Original:', message);
console.log('Clean:', cleanMessage);
console.log('Clean length:', cleanMessage.length);

// Test simpler patterns
console.log('\n=== Testing simpler patterns ===');
console.log('Contains "how":', cleanMessage.includes('how'));
console.log('Contains "get":', cleanMessage.includes('get'));
console.log('Contains "from":', cleanMessage.includes('from'));
console.log('Contains "carbon":', cleanMessage.includes('carbon'));
console.log('Contains "to":', cleanMessage.includes('to'));
console.log('Contains "apas":', cleanMessage.includes('apas'));

// Test very basic pattern
const basicPattern = /carbon/;
console.log('\nBasic pattern test (carbon):', basicPattern.test(cleanMessage));

// Test the actual structure
const words = cleanMessage.split(' ');
console.log('\nWords:', words);

// Try manual pattern
const manualPattern = /how\s+do\s+i\s+get\s+from\s+carbon\s+to\s+apas/;
console.log('Manual pattern test:', manualPattern.test(cleanMessage));
