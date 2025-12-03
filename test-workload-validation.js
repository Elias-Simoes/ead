// Teste simples para verificar o problema de validação do workload

console.log('🧪 Testando validação de workload\n');
console.log('='.repeat(70));

// Simular o que o frontend está enviando
const testCases = [
  { workload: 120, description: 'Número inteiro' },
  { workload: '120', description: 'String numérica' },
  { workload: 120.5, description: 'Número decimal' },
  { workload: '120.5', description: 'String decimal' },
  { workload: 0, description: 'Zero' },
  { workload: -10, description: 'Negativo' },
];

console.log('\n📝 Casos de teste:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.description}`);
  console.log(`   Valor: ${JSON.stringify(testCase.workload)}`);
  console.log(`   Tipo: ${typeof testCase.workload}`);
  
  // Validação esperada pelo Zod
  const isNumber = typeof testCase.workload === 'number';
  const isInteger = Number.isInteger(testCase.workload);
  const isPositive = testCase.workload > 0;
  
  const isValid = isNumber && isInteger && isPositive;
  
  console.log(`   Válido: ${isValid ? '✅' : '❌'}`);
  if (!isValid) {
    const reasons = [];
    if (!isNumber) reasons.push('não é número');
    if (isNumber && !isInteger) reasons.push('não é inteiro');
    if (isNumber && !isPositive) reasons.push('não é positivo');
    console.log(`   Motivo: ${reasons.join(', ')}`);
  }
  console.log('');
});

console.log('='.repeat(70));
console.log('\n💡 Conclusão:');
console.log('O Zod espera: z.number().int().positive()');
console.log('- Deve ser do tipo number (não string)');
console.log('- Deve ser inteiro (sem decimais)');
console.log('- Deve ser positivo (> 0)');
console.log('\n⚠️  Se o frontend enviar string, o Zod vai rejeitar!');
