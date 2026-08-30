import type {
  CreateTaskInput,
  Task,
  TaskFilters,
  TaskPriority,
  UpdateTaskInput,
} from '../domain/task.ts';
import type { TaskRepository } from '../domain/task-repository.ts';

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  getTasks(filters: TaskFilters): Task[] {
    const normalizedSearch = filters.search.trim().toLocaleLowerCase();

    return this.repository
      .getAll()
      .filter((task) => {
        if (filters.status === 'pending' && task.completed) return false;
        if (filters.status === 'completed' && !task.completed) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (normalizedSearch && !task.title.toLocaleLowerCase().includes(normalizedSearch)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  getStats(): { total: number; pending: number; completed: number; highPriority: number } {
    const tasks = this.repository.getAll();
    return {
      total: tasks.length,
      pending: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
      highPriority: tasks.filter((task) => task.priority === 'high' && !task.completed).length,
    };
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: crypto.randomUUID(),
      ...this.normalizeInput(input),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.repository.save(task);
    return task;
  }

  update(id: string, input: UpdateTaskInput): Task | null {
    const existing = this.repository.getAll().find((task) => task.id === id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...this.normalizeInput(input),
      updatedAt: new Date().toISOString(),
    };

    this.repository.save(updated);
    return updated;
  }

  toggleCompletion(id: string): Task | null {
    const existing = this.repository.getAll().find((task) => task.id === id);
    if (!existing) return null;

    const updated = { ...existing, completed: !existing.completed, updatedAt: new Date().toISOString() };
    this.repository.save(updated);
    return updated;
  }

  remove(id: string): void {
    this.repository.delete(id);
  }

  private normalizeInput(input: CreateTaskInput): Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'> {
    return {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority,
    };
  }

  static getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };
    return labels[priority];
  }
}
