/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../services/geminiService';
import { CheckCircle2, Circle, Clock, Trash2, AlertCircle, AlertTriangle, Info, PlayCircle, Edit3 } from 'lucide-react';
import TaskEditModal from './TaskEditModal';

interface TaskBoardProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string, priority: TaskPriority) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onUpdateTask, onDeleteTask, onAddTask }) => {
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskPriority, setNewTaskPriority] = React.useState<TaskPriority>(TaskPriority.MEDIUM);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), newTaskPriority);
      setNewTaskTitle('');
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return <AlertCircle className="w-4 h-4 text-destructive" />;
      case TaskPriority.HIGH: return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case TaskPriority.MEDIUM: return <Info className="w-4 h-4 text-blue-500" />;
      case TaskPriority.LOW: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case TaskStatus.IN_PROGRESS: return <PlayCircle className="w-5 h-5 text-blue-500 animate-pulse" />;
      case TaskStatus.PENDING: return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: 
        return <span className="px-2 py-0.5 text-[10px] font-bold border border-green-200 bg-green-50 text-green-700 rounded-full uppercase tracking-wider dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">Completed</span>;
      case TaskStatus.IN_PROGRESS: 
        return <span className="px-2 py-0.5 text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 rounded-full uppercase tracking-wider dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400">In Progress</span>;
      case TaskStatus.PENDING: 
        return <span className="px-2 py-0.5 text-[10px] font-bold border border-border bg-muted/50 text-muted-foreground rounded-full uppercase tracking-wider">Pending</span>;
    }
  };

  const getPriorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'border-destructive/20 bg-destructive/5 hover:border-destructive/40';
      case TaskPriority.HIGH: return 'border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40';
      case TaskPriority.MEDIUM: return 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40';
      case TaskPriority.LOW: return 'border-border bg-card hover:border-muted-foreground/30';
    }
  };

  const cycleStatus = (task: Task) => {
    const statuses = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onUpdateTask(task.id, { status: statuses[nextIndex] });
  };

  return (
    <div className="task-board">
      <div className="flex items-center justify-between mb-8">
        <h3 className="m-0 text-xl font-serif">Research Tasks</h3>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          {tasks.filter(t => t.status === TaskStatus.COMPLETED).length}/{tasks.length} Done
        </span>
      </div>
      
      <form onSubmit={handleAddTask} className="mb-10 flex gap-4">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 p-3 bg-transparent border-b border-border focus:outline-none focus:border-foreground transition-colors text-lg"
        />
        <select 
          value={newTaskPriority}
          onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
          className="bg-transparent border-b border-border text-sm focus:outline-none focus:border-foreground transition-colors px-2"
        >
          {Object.values(TaskPriority).map(p => (
            <option key={p} value={p} className="bg-background">{p.toUpperCase()}</option>
          ))}
        </select>
        <button type="submit" className="px-6 py-2 text-sm border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all rounded-full font-medium">
          Add Task
        </button>
      </form>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-8">No tasks yet. Ask kinich to help you plan your research!</p>
        ) : (
          [...tasks].sort((a, b) => {
            const priorities = { urgent: 0, high: 1, medium: 2, low: 3 };
            return priorities[a.priority] - priorities[b.priority];
          }).map(task => (
            <div 
              key={task.id} 
              className={`group p-4 border rounded-xl transition-all cursor-pointer hover:shadow-md ${getPriorityClass(task.priority)} ${task.status === TaskStatus.COMPLETED ? 'opacity-60' : ''}`}
              onClick={() => setEditingTask(task)}
            >
              <div className="flex items-start justify-between gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleStatus(task);
                  }}
                  className="mt-1"
                  title="Cycle Status"
                >
                  {getStatusIcon(task.status)}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getPriorityIcon(task.priority)}
                    <span className={`font-medium ${task.status === TaskStatus.COMPLETED ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                    {getStatusBadge(task.status)}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground ml-6 line-clamp-2 mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mt-3 ml-6 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      <Clock className="w-3 h-3" />
                      Due: {task.dueDate}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTask(task);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2"
                    title="Edit Task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingTask && (
        <TaskEditModal 
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={onUpdateTask}
        />
      )}
    </div>
  );
};

export default TaskBoard;
