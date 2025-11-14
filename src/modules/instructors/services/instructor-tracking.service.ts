import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface EnrolledStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessons: number;
  lastAccessedAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  finalScore: number | null;
}

export interface StudentDetailedProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  completedLessons: string[];
  totalLessons: number;
  lastAccessedAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  finalScore: number | null;
  totalStudyTime: number;
  modules: ModuleProgress[];
}

export interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  orderIndex: number;
  lessons: LessonProgress[];
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  lessonType: string;
  duration: number | null;
  orderIndex: number;
  isCompleted: boolean;
}

export interface InstructorDashboard {
  totalStudents: number;
  averageCompletionRate: number;
  pendingAssessments: number;
  courses: CourseStatistics[];
}

export interface CourseStatistics {
  courseId: string;
  courseTitle: string;
  courseStatus: string;
  totalStudents: number;
  averageProgress: number;
  completedStudents: number;
  pendingAssessments: number;
}

export interface InstructorCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  imageUrl: string | null;
  workload: number;
  createdAt: Date;
  studentsCount: number;
}

export class InstructorTrackingService {
  /**
   * Get all courses for an instructor
   */
  async getInstructorCourses(instructorId: string): Promise<InstructorCourse[]> {
    try {
      const result = await pool.query(
        `SELECT 
          c.id,
          c.title,
          c.description,
          c.category,
          c.status,
          c.cover_image as "imageUrl",
          c.workload,
          c.created_at as "createdAt",
          COUNT(DISTINCT sp.student_id) as "studentsCount"
        FROM courses c
        LEFT JOIN student_progress sp ON c.id = sp.course_id
        WHERE c.instructor_id = $1
        GROUP BY c.id
        ORDER BY c.created_at DESC`,
        [instructorId]
      );

      return result.rows.map(row => ({
        ...row,
        studentsCount: parseInt(row.studentsCount) || 0
      }));
    } catch (error) {
      logger.error('Failed to get instructor courses', { error, instructorId });
      throw error;
    }
  }
  /**
   * Get all students enrolled in a course (have started it)
   */
  async getEnrolledStudents(courseId: string, instructorId: string): Promise<EnrolledStudent[]> {
    try {
      // First verify that the instructor owns this course
      const ownershipCheck = await pool.query(
        'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
        [courseId, instructorId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new Error('COURSE_NOT_FOUND_OR_NOT_OWNED');
      }

      // Get total lessons count for the course
      const totalLessonsResult = await pool.query(
        `SELECT COUNT(l.id) as total
         FROM lessons l
         JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = $1`,
        [courseId]
      );

      const totalLessons = parseInt(totalLessonsResult.rows[0].total);

      // Get all students who have progress in this course
      const result = await pool.query(
        `SELECT sp.student_id, u.name as student_name, u.email as student_email,
                sp.progress_percentage, sp.last_accessed_at, sp.started_at, 
                sp.completed_at, sp.final_score,
                array_length(sp.completed_lessons, 1) as completed_lessons_count
         FROM student_progress sp
         JOIN students s ON sp.student_id = s.id
         JOIN users u ON s.id = u.id
         WHERE sp.course_id = $1
         ORDER BY sp.last_accessed_at DESC NULLS LAST, sp.started_at DESC`,
        [courseId]
      );

      return result.rows.map((row) => ({
        studentId: row.student_id,
        studentName: row.student_name,
        studentEmail: row.student_email,
        progressPercentage: parseFloat(row.progress_percentage),
        completedLessonsCount: row.completed_lessons_count || 0,
        totalLessons,
        lastAccessedAt: row.last_accessed_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        finalScore: row.final_score ? parseFloat(row.final_score) : null,
      }));
    } catch (error) {
      logger.error('Failed to get enrolled students', { courseId, instructorId, error });
      throw error;
    }
  }

  /**
   * Get detailed progress for a specific student in a course
   */
  async getStudentDetailedProgress(
    studentId: string,
    courseId: string,
    instructorId: string
  ): Promise<StudentDetailedProgress> {
    try {
      // Verify that the instructor owns this course
      const ownershipCheck = await pool.query(
        'SELECT id FROM courses WHERE id = $1 AND instructor_id = $2',
        [courseId, instructorId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new Error('COURSE_NOT_FOUND_OR_NOT_OWNED');
      }

      // Get student info and progress
      const progressResult = await pool.query(
        `SELECT sp.*, u.name as student_name, u.email as student_email,
                c.title as course_title, s.total_study_time
         FROM student_progress sp
         JOIN students s ON sp.student_id = s.id
         JOIN users u ON s.id = u.id
         JOIN courses c ON sp.course_id = c.id
         WHERE sp.student_id = $1 AND sp.course_id = $2`,
        [studentId, courseId]
      );

      if (progressResult.rows.length === 0) {
        throw new Error('STUDENT_PROGRESS_NOT_FOUND');
      }

      const progress = progressResult.rows[0];
      const completedLessons = progress.completed_lessons || [];

      // Get modules with lessons
      const modulesResult = await pool.query(
        `SELECT m.id as module_id, m.title as module_title, m.order_index as module_order,
                l.id as lesson_id, l.title as lesson_title, l.type as lesson_type,
                l.duration as lesson_duration, l.order_index as lesson_order
         FROM modules m
         LEFT JOIN lessons l ON m.id = l.module_id
         WHERE m.course_id = $1
         ORDER BY m.order_index, l.order_index`,
        [courseId]
      );

      // Group lessons by module
      const modulesMap = new Map<string, ModuleProgress>();
      let totalLessons = 0;

      for (const row of modulesResult.rows) {
        if (!modulesMap.has(row.module_id)) {
          modulesMap.set(row.module_id, {
            moduleId: row.module_id,
            moduleTitle: row.module_title,
            orderIndex: row.module_order,
            lessons: [],
          });
        }

        if (row.lesson_id) {
          modulesMap.get(row.module_id)!.lessons.push({
            lessonId: row.lesson_id,
            lessonTitle: row.lesson_title,
            lessonType: row.lesson_type,
            duration: row.lesson_duration,
            orderIndex: row.lesson_order,
            isCompleted: completedLessons.includes(row.lesson_id),
          });
          totalLessons++;
        }
      }

      const modules = Array.from(modulesMap.values());

      return {
        studentId: progress.student_id,
        studentName: progress.student_name,
        studentEmail: progress.student_email,
        courseId: progress.course_id,
        courseTitle: progress.course_title,
        progressPercentage: parseFloat(progress.progress_percentage),
        completedLessons,
        totalLessons,
        lastAccessedAt: progress.last_accessed_at,
        startedAt: progress.started_at,
        completedAt: progress.completed_at,
        finalScore: progress.final_score ? parseFloat(progress.final_score) : null,
        totalStudyTime: progress.total_study_time || 0,
        modules,
      };
    } catch (error) {
      logger.error('Failed to get student detailed progress', {
        studentId,
        courseId,
        instructorId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get instructor dashboard with metrics
   */
  async getInstructorDashboard(instructorId: string): Promise<InstructorDashboard> {
    try {
      // Get all courses by instructor
      const coursesResult = await pool.query(
        'SELECT id, title, status FROM courses WHERE instructor_id = $1',
        [instructorId]
      );

      const courses = coursesResult.rows;
      const courseIds = courses.map((c) => c.id);

      if (courseIds.length === 0) {
        return {
          totalStudents: 0,
          averageCompletionRate: 0,
          pendingAssessments: 0,
          courses: [],
        };
      }

      // Get total unique students across all courses
      const totalStudentsResult = await pool.query(
        `SELECT COUNT(DISTINCT student_id) as total
         FROM student_progress
         WHERE course_id = ANY($1)`,
        [courseIds]
      );

      const totalStudents = parseInt(totalStudentsResult.rows[0].total);

      // Get pending assessments count
      const pendingAssessmentsResult = await pool.query(
        `SELECT COUNT(*) as total
         FROM student_assessments sa
         JOIN assessments a ON sa.assessment_id = a.id
         WHERE a.course_id = ANY($1) AND sa.status = 'pending'`,
        [courseIds]
      );

      const pendingAssessments = parseInt(pendingAssessmentsResult.rows[0].total);

      // Get statistics for each course
      const courseStatistics: CourseStatistics[] = [];
      let totalCompletionRate = 0;
      let coursesWithStudents = 0;

      for (const course of courses) {
        // Get students enrolled in this course
        const courseStudentsResult = await pool.query(
          `SELECT COUNT(*) as total,
                  AVG(progress_percentage) as avg_progress,
                  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed
           FROM student_progress
           WHERE course_id = $1`,
          [course.id]
        );

        const courseStudents = parseInt(courseStudentsResult.rows[0].total);
        const avgProgress = parseFloat(courseStudentsResult.rows[0].avg_progress || 0);
        const completedStudents = parseInt(courseStudentsResult.rows[0].completed || 0);

        // Get pending assessments for this course
        const coursePendingResult = await pool.query(
          `SELECT COUNT(*) as total
           FROM student_assessments sa
           JOIN assessments a ON sa.assessment_id = a.id
           WHERE a.course_id = $1 AND sa.status = 'pending'`,
          [course.id]
        );

        const coursePendingAssessments = parseInt(coursePendingResult.rows[0].total);

        courseStatistics.push({
          courseId: course.id,
          courseTitle: course.title,
          courseStatus: course.status,
          totalStudents: courseStudents,
          averageProgress: Math.round(avgProgress * 100) / 100,
          completedStudents,
          pendingAssessments: coursePendingAssessments,
        });

        if (courseStudents > 0) {
          totalCompletionRate += avgProgress;
          coursesWithStudents++;
        }
      }

      // Calculate overall average completion rate
      const averageCompletionRate =
        coursesWithStudents > 0
          ? Math.round((totalCompletionRate / coursesWithStudents) * 100) / 100
          : 0;

      return {
        totalStudents,
        averageCompletionRate,
        pendingAssessments,
        courses: courseStatistics,
      };
    } catch (error) {
      logger.error('Failed to get instructor dashboard', { instructorId, error });
      throw error;
    }
  }
}

export const instructorTrackingService = new InstructorTrackingService();
