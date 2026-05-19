/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../services/geminiService';
import { X, Save, Calendar, AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface TaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onClose, onSave }) => {
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description || '');
  const [priority, setPriority] = React.useState<TaskPriority>(task.priority);
  const [status, setStatus] = React.useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = React.useState(task.dueDate || '');

  const handleSave = () => {
    onSave(task.id, {
      title,
      description,
      priority,
      status,
      dueDate: dueDate || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
          <h3 className="text-xl font-serif m-0">Edit Task</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-transparent border border-border rounded focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-2 bg-transparent border border-border rounded focus:outline-none focus:border-foreground transition-colors resize-none text-sm"
              placeholder="Add more details about this task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full p-2 bg-transparent border border-border rounded focus:outline-none focus:border-foreground transition-colors text-sm"
              >
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p} className="bg-background">{p.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full p-2 bg-transparent border border-border rounded focus:outline-none focus:border-foreground transition-colors text-sm"
              >
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s} className="bg-background">{s.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Due Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g., Tomorrow, Friday, Oct 25"
                className="w-full p-2 pl-8 bg-transparent border border-border rounded focus:outline-none focus:border-foreground transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/5">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border hover:bg-muted transition-colors rounded-full"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-foreground text-background hover:opacity-90 transition-opacity rounded-full flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;
