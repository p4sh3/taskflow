import { TaskService } from '../application/task-service.ts';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type Task,
  type TaskFilters,
  type TaskPriority,
} from '../domain/task.ts';

export class TaskView {
  private readonly root: Document;
  private readonly modal: HTMLDialogElement;
  private readonly form: HTMLFormElement;
  private readonly list: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly template: HTMLTemplateElement;
  private editingTaskId: string | null = null;

  constructor(private readonly service: TaskService) {
    this.root = document;
    this.modal = this.query<HTMLDialogElement>('#task-modal');
    this.form = this.query<HTMLFormElement>('#task-form');
    this.list = this.query<HTMLElement>('#task-list');
    this.empty = this.query<HTMLElement>('#empty-state');
    this.template = this.query<HTMLTemplateElement>('#task-card-template');

    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    this.query<HTMLButtonElement>('#new-task-btn').addEventListener('click', () => {
      this.openCreateModal();
    });

    this.query<HTMLButtonElement>('#close-modal-btn').addEventListener('click', () => {
      this.closeModal();
    });

    this.query<HTMLButtonElement>('#cancel-modal-btn').addEventListener('click', () => {
      this.closeModal();
    });

    this.form.addEventListener('submit', (event) => {
      this.handleSubmit(event);
    });

    this.query<HTMLInputElement>('#search-input').addEventListener('input', () => {
      this.render();
    });

    this.query<HTMLSelectElement>('#status-filter').addEventListener('change', () => {
      this.render();
    });

    this.query<HTMLSelectElement>('#priority-filter').addEventListener('change', () => {
      this.render();
    });

    this.query<HTMLButtonElement>('#reset-filters-btn').addEventListener('click', () => {
      this.resetFilters();
    });

    this.list.addEventListener('click', (event) => {
      this.handleTaskAction(event);
    });

    this.modal.addEventListener('close', () => {
      this.editingTaskId = null;
      this.form.reset();
    });
  }

  private handleSubmit(event: SubmitEvent): void {
    event.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    const formData = new FormData(this.form);

    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const category = String(formData.get('category') ?? '');
    const priority = String(formData.get('priority') ?? '');

    if (!title) {
      this.showValidationError('El título es obligatorio.');
      return;
    }

    if (!this.isValidCategory(category)) {
      this.showValidationError('La categoría seleccionada no es válida.');
      return;
    }

    if (!this.isValidPriority(priority)) {
      this.showValidationError('La prioridad seleccionada no es válida.');
      return;
    }

    const input = {
      title,
      description,
      category,
      priority,
    };

    try {
      if (this.editingTaskId) {
        const updatedTask = this.service.update(this.editingTaskId, input);

        if (!updatedTask) {
          this.showValidationError('No se encontró la tarea que intentas editar.');
          return;
        }
      } else {
        this.service.create(input);
      }

      this.closeModal();
      this.render();
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
      this.showValidationError(
        'No se pudo guardar la tarea. Inténtalo nuevamente.',
      );
    }
  }

  private handleTaskAction(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>('button[data-action]');

    if (!button) {
      return;
    }

    const { action, id } = button.dataset;

    if (!id) {
      return;
    }

    if (action === 'toggle') {
      this.service.toggleCompletion(id);
      this.render();
      return;
    }

    if (action === 'edit') {
      this.openEditModal(id);
      return;
    }

    if (action === 'delete') {
      this.deleteTask(id);
    }
  }

  private deleteTask(id: string): void {
    const task = this.service
      .getTasks({
        status: 'all',
        priority: 'all',
        search: '',
      })
      .find((item) => item.id === id);

    if (!task) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la tarea “${task.title}”?`,
    );

    if (!confirmed) {
      return;
    }

    this.service.remove(id);
    this.render();
  }

  private openCreateModal(): void {
    this.editingTaskId = null;

    this.form.reset();

    this.query<HTMLElement>('#modal-title').textContent = 'Nueva tarea';
    this.query<HTMLButtonElement>('#submit-btn').textContent = 'Crear tarea';

    this.setDefaultFormValues();

    this.modal.showModal();

    this.query<HTMLInputElement>('#task-title').focus();
  }

  private openEditModal(id: string): void {
    const task = this.service
      .getTasks({
        status: 'all',
        priority: 'all',
        search: '',
      })
      .find((item) => item.id === id);

    if (!task) {
      return;
    }

    this.editingTaskId = id;

    this.query<HTMLElement>('#modal-title').textContent = 'Editar tarea';
    this.query<HTMLButtonElement>('#submit-btn').textContent =
      'Guardar cambios';

    this.query<HTMLInputElement>('#task-title').value = task.title;
    this.query<HTMLTextAreaElement>('#task-description').value =
      task.description;
    this.query<HTMLSelectElement>('#task-category').value = task.category;
    this.query<HTMLSelectElement>('#task-priority').value = task.priority;

    this.modal.showModal();

    this.query<HTMLInputElement>('#task-title').focus();
  }

  private closeModal(): void {
    if (this.modal.open) {
      this.modal.close();
    }
  }

  private setDefaultFormValues(): void {
    const categorySelect =
      this.query<HTMLSelectElement>('#task-category');

    const prioritySelect =
      this.query<HTMLSelectElement>('#task-priority');

    categorySelect.value = 'Otros';
    prioritySelect.value = 'medium';
  }

  private resetFilters(): void {
    this.query<HTMLInputElement>('#search-input').value = '';
    this.query<HTMLSelectElement>('#status-filter').value = 'all';
    this.query<HTMLSelectElement>('#priority-filter').value = 'all';

    this.render();
  }

  private render(): void {
    const filters = this.getFilters();
    const tasks = this.service.getTasks(filters);
    const stats = this.service.getStats();

    this.query<HTMLElement>('#stat-total').textContent = String(stats.total);
    this.query<HTMLElement>('#stat-pending').textContent = String(
      stats.pending,
    );
    this.query<HTMLElement>('#stat-completed').textContent = String(
      stats.completed,
    );
    this.query<HTMLElement>('#stat-high').textContent = String(
      stats.highPriority,
    );

    this.query<HTMLElement>('#result-count').textContent =
      `${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'}`;

    const cards = tasks.map((task) => this.createTaskCard(task));

    this.list.replaceChildren(...cards);

    this.empty.hidden = tasks.length > 0;
  }

  private getFilters(): TaskFilters {
    return {
      search: this.query<HTMLInputElement>('#search-input').value,
      status: this.query<HTMLSelectElement>('#status-filter').value as TaskFilters['status'],
      priority:
        this.query<HTMLSelectElement>('#priority-filter').value as TaskFilters['priority'],
    };
  }

  private createTaskCard(task: Task): HTMLElement {
    const fragment = this.template.content.cloneNode(
      true,
    ) as DocumentFragment;

    const card = fragment.firstElementChild;

    if (!(card instanceof HTMLElement)) {
      throw new Error(
        'La plantilla de tarea no contiene un elemento raíz válido.',
      );
    }

    card.classList.toggle('is-completed', task.completed);
    card.dataset.id = task.id;

    const checkButton = this.queryFrom<HTMLElement>(
      card,
      '[data-action="toggle"]',
    );

    checkButton.dataset.id = task.id;

    checkButton.classList.toggle('checked', task.completed);

    checkButton.setAttribute(
      'aria-label',
      task.completed
        ? 'Marcar como pendiente'
        : 'Marcar como completada',
    );

    const checkMark = checkButton.querySelector('span');

    if (checkMark) {
      checkMark.textContent = task.completed ? '✓' : '';
    }

    this.queryFrom<HTMLElement>(
      card,
      '[data-field="category"]',
    ).textContent = task.category;

    const priority = this.queryFrom<HTMLElement>(
      card,
      '[data-field="priority"]',
    );

    priority.textContent = TaskService.getPriorityLabel(task.priority);

    priority.classList.add(this.getPriorityClass(task.priority));

    this.queryFrom<HTMLElement>(
      card,
      '[data-field="title"]',
    ).textContent = task.title;

    const description = this.queryFrom<HTMLElement>(
      card,
      '[data-field="description"]',
    );

    description.textContent =
      task.description || 'Sin descripción.';

    description.classList.toggle(
      'muted',
      !task.description,
    );

    this.queryFrom<HTMLButtonElement>(
      card,
      '[data-action="edit"]',
    ).dataset.id = task.id;

    this.queryFrom<HTMLButtonElement>(
      card,
      '[data-action="delete"]',
    ).dataset.id = task.id;

    return card;
  }

  private getPriorityClass(priority: TaskPriority): string {
    const priorityClasses: Record<TaskPriority, string> = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high',
    };

    return priorityClasses[priority];
  }

  private isValidCategory(
    category: string,
  ): category is (typeof TASK_CATEGORIES)[number] {
    return (TASK_CATEGORIES as readonly string[]).includes(category);
  }

  private isValidPriority(
    priority: string,
  ): priority is (typeof TASK_PRIORITIES)[number] {
    return (TASK_PRIORITIES as readonly string[]).includes(priority);
  }

  private showValidationError(message: string): void {
    window.alert(message);
  }

  private query<T extends Element>(selector: string): T {
    return this.queryFrom<T>(this.root, selector);
  }

  private queryFrom<T extends Element>(
    container: ParentNode,
    selector: string,
  ): T {
    const element = container.querySelector<T>(selector);

    if (!element) {
      throw new Error(
        `No se encontró el elemento ${selector}.`,
      );
    }

    return element;
  }
}