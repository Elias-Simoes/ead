require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugAssessmentIssue() {
  try {
    console.log('🔍 Investigando problema com avaliações...\n');

    // 1. Verificar todas as avaliações no banco
    console.log('1️⃣ Verificando avaliações no banco de dados:');
    const assessmentsResult = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.course_id,
        a.module_id,
        a.created_at,
        c.title as course_title,
        c.passing_score,
        m.title as module_title
      FROM assessments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN modules m ON a.module_id = m.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    
    if (assessmentsResult.rows.length === 0) {
      console.log('❌ Nenhuma avaliação encontrada no banco de dados!\n');
    } else {
      console.log(`✅ ${assessmentsResult.rows.length} avaliação(ões) encontrada(s):\n`);
      assessmentsResult.rows.forEach(assessment => {
        console.log(`   ID: ${assessment.id}`);
        console.log(`   Título: ${assessment.title}`);
        console.log(`   Curso: ${assessment.course_title} (ID: ${assessment.course_id})`);
        console.log(`   Módulo: ${assessment.module_title || 'N/A'} (ID: ${assessment.module_id || 'N/A'})`);
        console.log(`   Nota de corte: ${assessment.passing_score}`);
        console.log(`   Criada em: ${assessment.created_at}`);
        console.log('   ---');
      });
    }

    // 2. Verificar questões das avaliações
    console.log('\n2️⃣ Verificando questões das avaliações:');
    const questionsResult = await pool.query(`
      SELECT 
        q.id,
        q.assessment_id,
        q.question_text,
        q.question_type,
        q.points,
        a.title as assessment_title
      FROM assessment_questions q
      JOIN assessments a ON q.assessment_id = a.id
      ORDER BY q.assessment_id, q.order_index
    `);
    
    if (questionsResult.rows.length === 0) {
      console.log('❌ Nenhuma questão encontrada!\n');
    } else {
      console.log(`✅ ${questionsResult.rows.length} questão(ões) encontrada(s):\n`);
      
      const questionsByAssessment = {};
      questionsResult.rows.forEach(q => {
        if (!questionsByAssessment[q.assessment_id]) {
          questionsByAssessment[q.assessment_id] = [];
        }
        questionsByAssessment[q.assessment_id].push(q);
      });
      
      Object.entries(questionsByAssessment).forEach(([assessmentId, questions]) => {
        console.log(`   Avaliação: ${questions[0].assessment_title} (ID: ${assessmentId})`);
        console.log(`   Total de questões: ${questions.length}`);
        questions.forEach((q, idx) => {
          console.log(`     ${idx + 1}. ${q.question_text.substring(0, 50)}... (${q.points} pontos)`);
        });
        console.log('   ---');
      });
    }

    // 3. Verificar cursos do instrutor logado
    console.log('\n3️⃣ Verificando cursos e seus módulos:');
    const coursesResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.instructor_id,
        u.name as instructor_name,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT a.id) as assessment_count
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN modules m ON m.course_id = c.id
      LEFT JOIN assessments a ON a.course_id = c.id
      GROUP BY c.id, c.title, c.instructor_id, u.name
      ORDER BY c.created_at DESC
    `);
    
    if (coursesResult.rows.length === 0) {
      console.log('❌ Nenhum curso encontrado!\n');
    } else {
      console.log(`✅ ${coursesResult.rows.length} curso(s) encontrado(s):\n`);
      coursesResult.rows.forEach(course => {
        console.log(`   Curso: ${course.title} (ID: ${course.id})`);
        console.log(`   Instrutor: ${course.instructor_name} (ID: ${course.instructor_id})`);
        console.log(`   Módulos: ${course.module_count}`);
        console.log(`   Avaliações: ${course.assessment_count}`);
        console.log('   ---');
      });
    }

    // 4. Verificar módulos disponíveis
    console.log('\n4️⃣ Verificando módulos disponíveis:');
    const modulesResult = await pool.query(`
      SELECT 
        m.id,
        m.title,
        m.course_id,
        c.title as course_title,
        COUNT(a.id) as assessment_count
      FROM modules m
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN assessments a ON a.module_id = m.id
      GROUP BY m.id, m.title, m.course_id, c.title
      ORDER BY m.course_id, m.order_index
    `);
    
    if (modulesResult.rows.length === 0) {
      console.log('❌ Nenhum módulo encontrado!\n');
    } else {
      console.log(`✅ ${modulesResult.rows.length} módulo(s) encontrado(s):\n`);
      modulesResult.rows.forEach(module => {
        console.log(`   Módulo: ${module.title} (ID: ${module.id})`);
        console.log(`   Curso: ${module.course_title} (ID: ${module.course_id})`);
        console.log(`   Avaliações: ${module.assessment_count}`);
        console.log('   ---');
      });
    }

    console.log('\n✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro ao investigar:', error);
  } finally {
    await pool.end();
  }
}

debugAssessmentIssue();
