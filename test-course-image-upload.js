const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCourseImageUpload() {
  try {
    console.log('🔍 Testando upload de imagem para curso...\n');
    
    // Fazer login
    console.log('1. Fazendo login como instrutor...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'instructor@example.com',
      password: 'Instructor123!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login bem-sucedido\n');
    
    // Criar uma imagem de teste simples (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // Salvar temporariamente
    const tempImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(tempImagePath, testImageBuffer);
    
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
    
    const imageUrl = uploadResponse.data.data.url;
    console.log('✅ Upload bem-sucedido!');
    console.log('  URL:', imageUrl);
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempImagePath);
    
    // Atualizar curso com a imagem
    console.log('\n3. Atualizando curso com a imagem...');
    const courseId = '65cb2e3f-819f-456a-8efc-3d041bbd1883';
    
    const updateResponse = await axios.patch(
      `http://localhost:3000/api/courses/${courseId}`,
      {
        cover_image: imageUrl
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('✅ Curso atualizado!');
    console.log('  Status:', updateResponse.status);
    
    // Verificar se a imagem foi salva
    console.log('\n4. Verificando se a imagem foi salva...');
    const courseResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const course = courseResponse.data.data.course;
    
    if (course.cover_image) {
      console.log('✅ Imagem salva com sucesso!');
      console.log('  URL no banco:', course.cover_image);
    } else {
      console.log('❌ Imagem não foi salva no banco de dados');
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

testCourseImageUpload();
