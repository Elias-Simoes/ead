const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugModulesAndAssessments() {
  try {
    console.log('🔍 DIAGNÓSTICO: Módulos e Avaliações\n');
    console.log('=' .repeat(60));

    // Login como instrutor
    console.log('\n1️⃣ Fazendo login como instrutor...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'instructor@example.com',
      password: 'Senha123!',
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');

    // Usar um curso ID específico (você pode mudar isso)
    console.log('\n2️⃣ Digite o ID do curso para diagnosticar:');
    console.log('   (ou pressione Enter para usar um ID de exemplo)');
    
    // Para este script, vamos usar um ID fixo
    // Você pode mudar isso para o ID do seu curso
    const courseId = process.argv[2] || '1'; // Pega do argumento ou usa '1'
    console.log(`\n📚 Usando curso ID: ${courseId}`);

    // Buscar todos os módulos do curso
    console.log('\n3️⃣ Buscando TODOS os módulos do curso...');
    const modulesResponse = await axios.get(`${API_URL}/courses/${courseId}/modules`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const allModules = modulesResponse.data.data;
    console.log(`✅ Total de módulos: ${allModules.length}`);
    allModules.forEach((module, index) => {
      console.log(`   ${index + 1}. ${module.title} (ID: ${module.id})`);
    });

    // Buscar todas as avaliações do curso
    console.log('\n4️⃣ Buscando TODAS as avaliações do curso...');
    const assessmentsResponse = await axios.get(`${API_URL}/courses/${courseId}/assessments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const allAssessments = assessmentsResponse.data.data;
    console.log(`✅ Total de avaliações: ${allAssessments.length}`);
    
    if (allAssessments.length > 0) {
      console.log('\n📋 Detalhes das avaliações:');
      allAssessments.forEach((assessment, index) => {
        console.log(`\n   ${index + 1}. ${assessment.title}`);
        console.log(`      - ID: ${assessment.id}`);
        console.log(`      - Module ID: ${assessment.moduleId}`);
        console.log(`      - Module Title: ${assessment.moduleTitle || 'N/A'}`);
        console.log(`      - Questões: ${assessment.questions?.length || 0}`);
      });
    } else {
      console.log('   ⚠️ Nenhuma avaliação encontrada');
    }

    // Buscar módulos SEM avaliação
    console.log('\n5️⃣ Buscando módulos SEM avaliação...');
    const modulesWithoutResponse = await axios.get(
      `${API_URL}/courses/${courseId}/modules-without-assessments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const modulesWithout = modulesWithoutResponse.data.data.modules;
    console.log(`✅ Módulos sem avaliação: ${modulesWithout.length}`);
    
    if (modulesWithout.length > 0) {
      modulesWithout.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.title} (ID: ${module.id})`);
      });
    } else {
      console.log('   ℹ️ Todos os módulos já possuem avaliação');
    }

    // Verificar relação módulo-avaliação
    console.log('\n6️⃣ Verificando relação módulo-avaliação...');
    console.log('\n' + '='.repeat(60));
    console.log('MÓDULO'.padEnd(30) + ' | ' + 'TEM AVALIAÇÃO?');
    console.log('='.repeat(60));

    for (const module of allModules) {
      const hasAssessment = allAssessments.some(a => a.moduleId === module.id);
      const status = hasAssessment ? '✅ SIM' : '❌ NÃO';
      console.log(`${module.title.padEnd(30)} | ${status}`);
      
      if (hasAssessment) {
        const assessment = allAssessments.find(a => a.moduleId === module.id);
        console.log(`${''.padEnd(30)} |    └─ ${assessment.title}`);
      }
    }
    console.log('='.repeat(60));

    // Verificar inconsistências
    console.log('\n7️⃣ Verificando inconsistências...\n');
    
    const modulesWithAssessment = allModules.filter(m => 
      allAssessments.some(a => a.moduleId === m.id)
    );
    
    const modulesWithoutAssessment = allModules.filter(m => 
      !allAssessments.some(a => a.moduleId === m.id)
    );

    console.log(`📊 Resumo:`);
    console.log(`   - Total de módulos: ${allModules.length}`);
    console.log(`   - Módulos COM avaliação: ${modulesWithAssessment.length}`);
    console.log(`   - Módulos SEM avaliação: ${modulesWithoutAssessment.length}`);
    console.log(`   - Total de avaliações: ${allAssessments.length}`);

    // Verificar se há avaliações órfãs (sem módulo)
    const orphanAssessments = allAssessments.filter(a => 
      !allModules.some(m => m.id === a.moduleId)
    );

    if (orphanAssessments.length > 0) {
      console.log(`\n⚠️ PROBLEMA: ${orphanAssessments.length} avaliação(ões) órfã(s) (sem módulo correspondente):`);
      orphanAssessments.forEach(a => {
        console.log(`   - ${a.title} (Module ID: ${a.moduleId})`);
      });
    }

    // Verificar se a API de módulos sem avaliação está correta
    const expectedModulesWithout = modulesWithoutAssessment.map(m => m.id).sort();
    const actualModulesWithout = modulesWithout.map(m => m.id).sort();

    if (JSON.stringify(expectedModulesWithout) !== JSON.stringify(actualModulesWithout)) {
      console.log(`\n❌ INCONSISTÊNCIA DETECTADA!`);
      console.log(`   Esperado: ${expectedModulesWithout.length} módulos sem avaliação`);
      console.log(`   Retornado pela API: ${actualModulesWithout.length} módulos sem avaliação`);
      
      const missing = expectedModulesWithout.filter(id => !actualModulesWithout.includes(id));
      const extra = actualModulesWithout.filter(id => !expectedModulesWithout.includes(id));
      
      if (missing.length > 0) {
        console.log(`\n   Módulos faltando na API:`);
        missing.forEach(id => {
          const module = allModules.find(m => m.id === id);
          console.log(`      - ${module?.title} (${id})`);
        });
      }
      
      if (extra.length > 0) {
        console.log(`\n   Módulos extras na API (não deveriam estar):`);
        extra.forEach(id => {
          const module = allModules.find(m => m.id === id);
          console.log(`      - ${module?.title} (${id})`);
        });
      }
    } else {
      console.log(`\n✅ API de módulos sem avaliação está correta!`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnóstico concluído!\n');

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugModulesAndAssessments();
