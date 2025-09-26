const { ReplicaCRUDService } = require('./src/lib/services/replica-crud-service');

// Test the system message generation
const service = new ReplicaCRUDService('test-key');
const systemMessage = service.getShopifyActionSystemMessage();

console.log('=== Testing System Message Generation ===');
console.log('Length:', systemMessage.length);
console.log('Contains CRITICAL section:', systemMessage.includes('CRITICAL: Intent Pattern Recognition'));
console.log('Contains infinix example:', systemMessage.includes('infinix note 30 price to $10.00'));
console.log('Contains JSON response format:', systemMessage.includes('"type": "action"'));

console.log('\n=== First 500 characters ===');
console.log(systemMessage.substring(0, 500) + '...');

console.log('\n=== Pattern Recognition Section ===');
const patternStart = systemMessage.indexOf('CRITICAL: Intent Pattern Recognition');
if (patternStart !== -1) {
  console.log(systemMessage.substring(patternStart, patternStart + 800) + '...');
} else {
  console.log('Pattern recognition section not found!');
}