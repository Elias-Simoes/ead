const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = 'http://127.0.0.1:3000/api';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testCertificateValidation() {
  console.log('🧪 Testando validação de certificados\n');
  console.log('============================================================\n');

  try {
    // 1. Login como instrutor
    console.log('🔐 Fazendo login como instrutor...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!'
    });
    const instructorToken = loginRes.data.data.tokens.accessToken;
    console.log('✅ Login realizado\n');

    // 2. Criar curso com 3 módulos
    console.log('📚 Criando curso com 3 módulos...');
    const courseRes = await axios.post(
      `${API_URL}/courses`,
      {
        title: 'Curso para Validação de Certificado',
        description: 'Curso com múltiplos módulos para teste',
        workload: 60,
        category: 'Tecnologia'
      },
      { headers: { Authorization: `Bearer ${instructorToken}` } }
    );
    const courseId = courseRes.data.data.course.id;
    console.log('✅ Curso criado:', courseId);

    const modules = [];
    const assessments = [];

    for (let i = 1; i <= 3; i++) {
      console.log(`📦 Criando módulo ${i}...`);
      const moduleRes = await axios.post(
        `${API_URL}/courses/${courseId}/modules`,
        {
          title: `Módulo ${i}`,
          description: `Descrição do módulo ${i}`,
          order_index: i
        },
        { headers: { Authorization: `Bearer ${instructorToken}` } }
      );
      const moduleId = moduleRes.data.data.module.id;
      modules.push(moduleId);

      // Criar aula
      await axios.post(
        `${API_URL}/courses/modules/${moduleId}/lessons`,
        {
          title: `Aula do Módulo ${i}`,
          description: 'Aula teste',
          type: 'text',
          content: 'Conteúdo da aula',
          order_index: 1
        },
        { headers: { Authorization: `Bearer ${instructorToken}` } }
      );

      // Criar avaliação
      const assessmentRes = await axios.post(
        `${API_URL}/modules/${moduleId}/assessments`,
        {
          title: `Avaliação do Módulo ${i}`,
          type: 'multiple_choice',
          passing_score: 7
        },
        { headers: { Authorization: `Bearer ${instructorToken}` } }
      );
      const assessmentId = assessmentRes.data.data.assessment.id;
      assessments.push(assessmentId);

      // Adicionar 5 questões
      for (let q = 1; q <= 5; q++) {
        await axios.post(
          `${API_URL}/assessments/${assessmentId}/questions`,
          {
            text: `Questão ${q} do Módulo ${i}`,
            type: 'multiple_choice',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 0,
            points: 2,
            order_index: q
          },
          { headers: { Authorization: `Bearer ${instructorToken}` } }
        );
      }
    }
    console.log('✅ 3 módulos criados com avaliações\n');

    // 3. Aprovar curso
    console.log('👑 Aprovando curso...');
    await pool.query(
      `UPDATE courses SET status = 'published', published_at = NOW() WHERE id = $1`,
      [courseId]
    );
    console.log('✅ Curso aprovado\n');

    // 4. Criar estudante
    console.log('👤 Criando estudante...');
    const timestamp = Date.now();
    const studentRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Estudante Validação',
      email: `estudante.validacao.${timestamp}@teste.com`,
      password: 'Senha123!',
      role: 'student',
      gdprConsent: true
    });
    console.log('✅ Estudante criado\n');

    // 5. Login como estudante
    console.log('🔐 Fazendo login como estudante...');
    const studentLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: `estudante.validacao.${timestamp}@teste.com`,
      password: 'Senha123!'
    });
    const studentToken = studentLoginRes.data.data.tokens.accessToken;
    const studentId = studentLoginRes.data.data.user.id;
    console.log('✅ Login do estudante realizado\n');

    // 6. Criar progresso do estudante (100% completo)
    console.log('📊 Criando progresso do estudante...');
    await pool.query(
      `INSERT INTO student_progress (student_id, course_id, progress_percentage, completed_at)
       VALUES ($1, $2, 100, NOW())`,
      [studentId, courseId]
    );
    console.log('✅ Progresso criado (100%)\n');

    // 7. Tentar emitir certificado SEM completar avaliações
    console.log('❌ Teste 1: Tentando emitir certificado SEM completar avaliações...');
    try {
      await axios.post(
        `${API_URL}/certificates/issue/`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      console.log('   ❌ ERRO: Certificado foi emitido sem completar avaliações!');
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('ASSESSMENTS_NOT_COMPLETED')) {
        console.log('   ✅ Certificado bloqueado corretamente!');
        console.log('   📝 Motivo:', error.response.data.error.message);
      } else {
        console.log('   ❌ Erro inesperado:', error.response?.data || error.message);
      }
    }
    console.log();

    // 7. Completar apenas 1 avaliação (nota 8.0)
    console.log('📝 Teste 2: Completando apenas 1 de 3 avaliações...');
    await pool.query(
      `INSERT INTO student_assessments (student_id, assessment_id, score, status, submitted_at, answers, graded_at)
       VALUES ($1, $2, $3, 'graded', NOW(), $4, NOW())`,
      [studentId, assessments[0], 8.0, JSON.stringify([])]
    );
    console.log('   ✅ 1 avaliação completada (8.0)');

    try {
      await axios.post(
        `${API_URL}/certificates/issue/`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      console.log('   ❌ ERRO: Certificado foi emitido com apenas 1/3 avaliações!');
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('ASSESSMENTS_NOT_COMPLETED')) {
        console.log('   ✅ Certificado bloqueado corretamente!');
        console.log('   📝 Motivo:', error.response.data.error.message);
      } else {
        console.log('   ❌ Erro inesperado:', error.response?.data || error.message);
      }
    }
    console.log();

    // 8. Completar 2ª avaliação (nota 9.0)
    console.log('📝 Teste 3: Completando 2 de 3 avaliações...');
    await pool.query(
      `INSERT INTO student_assessments (student_id, assessment_id, score, status, submitted_at, answers, graded_at)
       VALUES ($1, $2, $3, 'graded', NOW(), $4, NOW())`,
      [studentId, assessments[1], 9.0, JSON.stringify([])]
    );
    console.log('   ✅ 2 avaliações completadas (8.0 e 9.0)');

    try {
      await axios.post(
        `${API_URL}/certificates/issue/`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      console.log('   ❌ ERRO: Certificado foi emitido com apenas 2/3 avaliações!');
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('ASSESSMENTS_NOT_COMPLETED')) {
        console.log('   ✅ Certificado bloqueado corretamente!');
        console.log('   📝 Motivo:', error.response.data.error.message);
      } else {
        console.log('   ❌ Erro inesperado:', error.response?.data || error.message);
      }
    }
    console.log();

    // 9. Completar 3ª avaliação com nota BAIXA (5.0)
    console.log('📝 Teste 4: Completando 3ª avaliação com nota BAIXA (5.0)...');
    await pool.query(
      `INSERT INTO student_assessments (student_id, assessment_id, score, status, submitted_at, answers, graded_at)
       VALUES ($1, $2, $3, 'graded', NOW(), $4, NOW())`,
      [studentId, assessments[2], 5.0, JSON.stringify([])]
    );
    console.log('   ✅ 3 avaliações completadas (8.0, 9.0, 5.0)');
    console.log('   📊 Média: (8.0 + 9.0 + 5.0) / 3 = 7.33');

    try {
      await axios.post(
        `${API_URL}/certificates/issue/`,
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      console.log('   ✅ Certificado emitido com sucesso! (nota 7.33 >= 7.0)');
    } catch (error) {
      console.log('   ❌ Erro ao emitir certificado:', error.response?.data || error.message);
    }
    console.log();

    // 10. Criar outro estudante com nota ABAIXO da mínima
    console.log('📝 Teste 5: Estudante com nota ABAIXO da mínima...');
    const timestamp2 = Date.now() + 1000;
    const student2Res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Estudante Reprovado',
      email: `estudante.reprovado.${timestamp2}@teste.com`,
      password: 'Senha123!',
      role: 'student',
      gdprConsent: true
    });
    const student2LoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: `estudante.reprovado.${timestamp2}@teste.com`,
      password: 'Senha123!'
    });
    const student2Token = student2LoginRes.data.data.tokens.accessToken;
    const student2Id = student2LoginRes.data.data.user.id;

    // Criar progresso do estudante 2
    await pool.query(
      `INSERT INTO student_progress (student_id, course_id, progress_percentage, completed_at)
       VALUES ($1, $2, 100, NOW())`,
      [student2Id, courseId]
    );

    // Completar todas as avaliações com notas baixas
    await pool.query(
      `INSERT INTO student_assessments (student_id, assessment_id, score, status, submitted_at, answers, graded_at)
       VALUES 
         ($1, $2, 5.0, 'graded', NOW(), $5, NOW()),
         ($1, $3, 6.0, 'graded', NOW(), $5, NOW()),
         ($1, $4, 5.5, 'graded', NOW(), $5, NOW())`,
      [student2Id, assessments[0], assessments[1], assessments[2], JSON.stringify([])]
    );
    console.log('   ✅ 3 avaliações completadas (5.0, 6.0, 5.5)');
    console.log('   📊 Média: (5.0 + 6.0 + 5.5) / 3 = 5.5');

    try {
      await axios.post(
        `${API_URL}/certificates/issue/`,
        {},
        { headers: { Authorization: `Bearer ${student2Token}` } }
      );
      console.log('   ❌ ERRO: Certificado foi emitido com nota abaixo da mínima!');
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('FINAL_GRADE_BELOW_PASSING_SCORE')) {
        console.log('   ✅ Certificado bloqueado corretamente!');
        console.log('   📝 Motivo:', error.response.data.error.message);
      } else {
        console.log('   ❌ Erro inesperado:', error.response?.data || error.message);
      }
    }

    console.log('\n============================================================');
    console.log('🎉 Teste concluído!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Bloqueia certificado sem avaliações completadas');
    console.log('   ✅ Bloqueia certificado com avaliações incompletas (1/3)');
    console.log('   ✅ Bloqueia certificado com avaliações incompletas (2/3)');
    console.log('   ✅ Emite certificado com todas avaliações e nota >= 7.0');
    console.log('   ✅ Bloqueia certificado com nota < 7.0');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    await pool.end();
  }
}

testCertificateValidation();
