/**
 * Teste rápido de validação
 */

const baseUrl = 'http://localhost:3000';

async function testValidation() {
  console.log('🧪 Testando validação de senha...\n');

  // Teste 1: Senha muito curta
  console.log('1. Testando senha muito curta (123456)...');
  const response1 = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: '123456',
      gdprConsent: true,
    }),
  });

  const data1 = await response1.json();
  console.log(`   Status: ${response1.status}`);
  console.log(`   Resposta:`, JSON.stringify(data1, null, 2));

  // Teste 2: Senha sem caractere especial
  console.log('\n2. Testando senha sem caractere especial (Password123)...');
  const response2 = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: 'Password123',
      gdprConsent: true,
    }),
  });

  const data2 = await response2.json();
  console.log(`   Status: ${response2.status}`);
  console.log(`   Resposta:`, JSON.stringify(data2, null, 2));

  // Teste 3: Senha sem maiúscula
  console.log('\n3. Testando senha sem maiúscula (password123!)...');
  const response3 = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123!',
      gdprConsent: true,
    }),
  });

  const data3 = await response3.json();
  console.log(`   Status: ${response3.status}`);
  console.log(`   Resposta:`, JSON.stringify(data3, null, 2));

  // Teste 4: Senha válida
  console.log('\n4. Testando senha válida (SecurePass123!)...');
  const response4 = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: 'SecurePass123!',
      gdprConsent: true,
    }),
  });

  const data4 = await response4.json();
  console.log(`   Status: ${response4.status}`);
  console.log(`   Resposta:`, JSON.stringify(data4, null, 2));

  // Teste 5: Sem consentimento GDPR
  console.log('\n5. Testando sem consentimento GDPR...');
  const response5 = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      password: 'SecurePass123!',
      gdprConsent: false,
    }),
  });

  const data5 = await response5.json();
  console.log(`   Status: ${response5.status}`);
  console.log(`   Resposta:`, JSON.stringify(data5, null, 2));

  console.log('\n✅ Testes de validação concluídos!');
}

testValidation().catch(console.error);
