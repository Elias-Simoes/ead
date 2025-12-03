-- Migration: Avaliações por Módulo
-- Data: 2025-11-25
-- Descrição: Reestrutura sistema de avaliações para ter uma avaliação por módulo

-- ============================================
-- PARTE 1: Preparação e Backup
-- ============================================

-- Criar tabela temporária para backup dos dados existentes
CREATE TABLE IF NOT EXISTS assessments_backup AS 
SELECT * FROM assessments;

CREATE TABLE IF NOT EXISTS student_assessments_backup AS 
SELECT * FROM student_assessments;

-- ============================================
-- PARTE 2: Alterações na Tabela assessments
-- ============================================

-- Adicionar coluna module_id
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS module_id UUID;

-- Adicionar foreign key para modules
ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_module 
FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;

-- Adicionar constraint de unicidade (um módulo = uma avaliação)
ALTER TABLE assessments 
ADD CONSTRAINT unique_module_assessment 
UNIQUE(module_id);

-- Remover coluna course_id (após migrar dados se necessário)
-- NOTA: Descomente apenas após migrar dados existentes
-- ALTER TABLE assessments DROP COLUMN IF EXISTS course_id;

-- Remover coluna passing_score (agora é do curso)
ALTER TABLE assessments 
DROP COLUMN IF EXISTS passing_score;

-- ============================================
-- PARTE 3: Alterações na Tabela courses
-- ============================================

-- Adicionar coluna passing_score (nota de corte para certificado)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS passing_score DECIMAL(5,2) DEFAULT 7.0;

-- Adicionar comentário
COMMENT ON COLUMN courses.passing_score IS 'Nota de corte para emissão de certificado (0-10)';

-- ============================================
-- PARTE 4: Alterações na Tabela student_assessments
-- ============================================

-- Remover constraint de unicidade antiga (se existir)
ALTER TABLE student_assessments 
DROP CONSTRAINT IF EXISTS unique_student_assessment;

ALTER TABLE student_assessments 
DROP CONSTRAINT IF EXISTS student_assessments_student_id_assessment_id_key;

-- Adicionar coluna attempt_number (número da tentativa)
ALTER TABLE student_assessments 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- Adicionar coluna is_latest (marca a última tentativa)
ALTER TABLE student_assessments 
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Adicionar comentários
COMMENT ON COLUMN student_assessments.attempt_number IS 'Número da tentativa (1, 2, 3...)';
COMMENT ON COLUMN student_assessments.is_latest IS 'Indica se é a última tentativa do aluno';

-- Criar índice para buscar última tentativa rapidamente
CREATE INDEX IF NOT EXISTS idx_student_assessments_latest 
ON student_assessments(student_id, assessment_id, is_latest) 
WHERE is_latest = true;

-- Criar índice para buscar todas as tentativas de um aluno
CREATE INDEX IF NOT EXISTS idx_student_assessments_attempts 
ON student_assessments(student_id, assessment_id, attempt_number);

-- ============================================
-- PARTE 5: Alterações na Tabela certificates
-- ============================================

-- Adicionar coluna final_grade (nota final obtida)
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS final_grade DECIMAL(5,2);

-- Adicionar comentário
COMMENT ON COLUMN certificates.final_grade IS 'Nota final obtida pelo aluno (média das avaliações)';

-- ============================================
-- PARTE 6: Migração de Dados Existentes
-- ============================================

-- NOTA: Este script assume que você está começando do zero ou
-- que vai migrar os dados manualmente. Se houver dados existentes,
-- você precisará criar um script de migração específico.

-- Exemplo de migração (ajuste conforme necessário):
-- UPDATE assessments a
-- SET module_id = (
--   SELECT m.id 
--   FROM modules m 
--   WHERE m.course_id = a.course_id 
--   LIMIT 1
-- )
-- WHERE module_id IS NULL;

-- ============================================
-- PARTE 7: Validações e Constraints Finais
-- ============================================

-- Após migrar dados, tornar module_id obrigatório
-- NOTA: Descomente apenas após migrar todos os dados
-- ALTER TABLE assessments ALTER COLUMN module_id SET NOT NULL;

-- ============================================
-- PARTE 8: Verificações
-- ============================================

-- Verificar estrutura das tabelas
DO $$
BEGIN
  -- Verificar se module_id existe em assessments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'module_id'
  ) THEN
    RAISE EXCEPTION 'Coluna module_id não foi criada em assessments';
  END IF;

  -- Verificar se passing_score existe em courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'passing_score'
  ) THEN
    RAISE EXCEPTION 'Coluna passing_score não foi criada em courses';
  END IF;

  -- Verificar se attempt_number existe em student_assessments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_assessments' AND column_name = 'attempt_number'
  ) THEN
    RAISE EXCEPTION 'Coluna attempt_number não foi criada em student_assessments';
  END IF;

  -- Verificar se is_latest existe em student_assessments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_assessments' AND column_name = 'is_latest'
  ) THEN
    RAISE EXCEPTION 'Coluna is_latest não foi criada em student_assessments';
  END IF;

  -- Verificar se final_grade existe em certificates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'final_grade'
  ) THEN
    RAISE EXCEPTION 'Coluna final_grade não foi criada em certificates';
  END IF;

  RAISE NOTICE 'Migration 023 executada com sucesso!';
END $$;

-- ============================================
-- PARTE 9: Estatísticas e Informações
-- ============================================

-- Mostrar estatísticas após migration
SELECT 
  'assessments' as tabela,
  COUNT(*) as total_registros,
  COUNT(module_id) as com_module_id,
  COUNT(*) - COUNT(module_id) as sem_module_id
FROM assessments
UNION ALL
SELECT 
  'student_assessments' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN is_latest THEN 1 END) as ultimas_tentativas,
  COUNT(CASE WHEN NOT is_latest THEN 1 END) as tentativas_antigas
FROM student_assessments
UNION ALL
SELECT 
  'courses' as tabela,
  COUNT(*) as total_registros,
  COUNT(passing_score) as com_nota_corte,
  COUNT(*) - COUNT(passing_score) as sem_nota_corte
FROM courses;

-- ============================================
-- ROLLBACK (se necessário)
-- ============================================

-- Para reverter esta migration, execute:
/*
-- Restaurar dados de backup
TRUNCATE assessments;
INSERT INTO assessments SELECT * FROM assessments_backup;

TRUNCATE student_assessments;
INSERT INTO student_assessments SELECT * FROM student_assessments_backup;

-- Remover colunas adicionadas
ALTER TABLE assessments DROP COLUMN IF EXISTS module_id;
ALTER TABLE courses DROP COLUMN IF EXISTS passing_score;
ALTER TABLE student_assessments DROP COLUMN IF EXISTS attempt_number;
ALTER TABLE student_assessments DROP COLUMN IF EXISTS is_latest;
ALTER TABLE certificates DROP COLUMN IF EXISTS final_grade;

-- Remover índices
DROP INDEX IF EXISTS idx_student_assessments_latest;
DROP INDEX IF EXISTS idx_student_assessments_attempts;

-- Remover constraints
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS fk_assessments_module;
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS unique_module_assessment;

-- Remover tabelas de backup
DROP TABLE IF EXISTS assessments_backup;
DROP TABLE IF EXISTS student_assessments_backup;
*/
