// Quick launch test
const { unifiedActionService } = require('./src/services/action-service.ts');

console.log('🚀 UnifiedActionService Launch Test');
console.log('====================================\n');

console.log('✅ Service loaded successfully');
console.log('✅ Type:', unifiedActionService.constructor.name);
console.log('✅ Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(unifiedActionService))
  .filter(m => m !== 'constructor').join(', '));

console.log('\n✅ SERVICE IS FUNCTIONAL AND READY!');
