const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageKeySystem() {
  try {
    console.log('🔍 Testando sistema de key/URL de imagens...\n');
    
    // Fazer login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido\n');
    
    // Criar imagem de teste
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const tempImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(tempImagePath, testImageBuffer);
    
    // Upload da imagem
    console.log('2. Fazendo upload da imagem...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempImagePath));
    formData.append('folder', 'courses');
    
    const uploadResponse = await axios.post('http://localhost:3000/api/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    const imageKey = uploadResponse.data.data.key;
    const imageUrl = uploadResponse.data.data.url;
    
    console.log('✅ Upload bem-sucedido!');
    console.log('  Key:', imageKey);
    console.log('  URL:', imageUrl);
    
    fs.unlinkSync(tempImagePath);
    
    // Atualizar curso com a KEY (não a URL)
    console.log('\n3. Atualizando curso com a KEY...');
    const courseId = '65cb2e3f-819f-456a-8efc-3d041bbd1883';
    
    await axios.patch(
      `http://localhost:3000/api/courses/${courseId}`,
      {
        cover_image: imageKey // Enviando apenas a key
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('✅ Curso atualizado com a key!');
    
    // Buscar curso e verificar
    console.log('\n4. Buscando curso para verificar...');
    const courseResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const course = courseResponse.data.data.course;
    
    console.log('\n📊 Resultado:');
    console.log('  cover_image (key no banco):', course.cover_image);
    console.log('  cover_image_url (URL construída):', course.cover_image_url);
    
    if (course.cover_image && course.cover_image_url) {
      console.log('\n✅ Sistema funcionando corretamente!');
      console.log('  ✓ Key salva no banco');
      console.log('  ✓ URL construída dinamicamente');
      
      // Verificar se a key não é uma URL
      if (!course.cover_image.startsWith('http')) {
        console.log('  ✓ Key não é URL (correto!)');
      } else {
        console.log('  ⚠️  Key ainda é URL (deveria ser apenas a key)');
      }
      
      // Verificar se a URL é válida
      if (course.cover_image_url.startsWith('http')) {
        console.log('  ✓ URL construída corretamente');
      }
    } else {
      console.log('\n❌ Algo não está funcionando');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testImageKeySystem();
