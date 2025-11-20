import { Request, Response } from 'express';
import { LessonResourceService } from '../services/lesson-resource.service';
import { LessonService } from '../services/lesson.service';

const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  ...(message && { message }),
});

const lessonResourceService = new LessonResourceService();
const lessonService = new LessonService();

export class LessonResourceController {
  async createResources(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { resources } = req.body;

      console.log('📎 createResources chamado:', {
        lessonId,
        resourcesCount: resources?.length,
        resources: JSON.stringify(resources, null, 2)
      });

      // Verificar se a aula existe e se o usuário tem permissão
      const lesson = await lessonService.getLessonById(lessonId);
      
      // Verificar se o usuário é o instrutor do curso
      const userId = (req.user as any)?.userId; // Corrigido: userId ao invés de id
      console.log('👤 Verificando permissão:', { userId, instructorId: lesson.instructor_id });
      
      if (lesson.instructor_id !== userId) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Você não tem permissão para adicionar recursos a esta aula',
          },
        });
        return;
      }

      const createdResources = await lessonResourceService.createResources(lessonId, resources);
      console.log('✅ Recursos criados:', createdResources.length);

      res.status(201).json(successResponse(createdResources, 'Recursos criados com sucesso'));
    } catch (error) {
      console.error('❌ Erro ao criar recursos:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro ao criar recursos',
        },
      });
    }
  }

  async getResourcesByLessonId(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;

    const resources = await lessonResourceService.getResourcesByLessonId(lessonId);

    res.json(successResponse(resources));
  }

  async getResourceById(req: Request, res: Response): Promise<void> {
    const { resourceId } = req.params;

    const resource = await lessonResourceService.getResourceById(resourceId);

    res.json(successResponse(resource));
  }

  async updateResource(req: Request, res: Response): Promise<void> {
    const { resourceId } = req.params;
    const updateData = req.body;

    // Verificar permissão
    const resource = await lessonResourceService.getResourceById(resourceId);
    const lesson = await lessonService.getLessonById(resource.lesson_id);
    
    const userId = (req.user as any)?.id;
    if (lesson.instructor_id !== userId) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para atualizar este recurso',
        },
      });
      return;
    }

    const updatedResource = await lessonResourceService.updateResource(resourceId, updateData);

    res.json(successResponse(updatedResource, 'Recurso atualizado com sucesso'));
  }

  async deleteResource(req: Request, res: Response): Promise<void> {
    const { resourceId } = req.params;

    // Verificar permissão
    const resource = await lessonResourceService.getResourceById(resourceId);
    const lesson = await lessonService.getLessonById(resource.lesson_id);
    
    const userId = (req.user as any)?.id;
    if (lesson.instructor_id !== userId) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Você não tem permissão para deletar este recurso',
        },
      });
      return;
    }

    await lessonResourceService.deleteResource(resourceId);

    res.json(successResponse(null, 'Recurso deletado com sucesso'));
  }
}
