'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Calendar as CalendarIcon, LogOut, BarChart2, ChevronDown, Loader2, LayoutDashboard, CheckSquare } from 'lucide-react';
import { getTaskBreakdown } from '@/lib/gemini';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { PomodoroTimer } from '@/components/pomodoro-timer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
  ai_suggestions?: string;
  is_generating?: boolean;
  isExpanded?: boolean;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [date, setDate] = useState<Date>();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as 'low' | 'medium' | 'high' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks'>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    fetchTasks();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
    }
  };

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      if (tasks) {
        setTasks(tasks.map(task => ({
          ...task,
          date: new Date(task.date),
          isExpanded: false
        })));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleAddTask = async () => {
    if (!date || !newTask.title || !newTask.description || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title,
          description: newTask.description,
          date: date.toISOString(),
          priority: newTask.priority,
          user_id: session.user.id,
          is_generating: true
        }])
        .select()
        .single();

      if (error) throw error;

      if (task) {
        const taskWithMeta = {
          ...task,
          date: new Date(task.date),
          isExpanded: false
        };
        
        setTasks(prev => [taskWithMeta, ...prev]);
        setIsAddingTask(false);
        setNewTask({ title: '', description: '', priority: 'medium' });
        setDate(undefined);

        try {
          const suggestions = await getTaskBreakdown(task.description);
          
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
              ai_suggestions: suggestions,
              is_generating: false 
            })
            .eq('id', task.id);

          if (!updateError) {
            setTasks(prev => prev.map(t => 
              t.id === task.id 
                ? { ...t, ai_suggestions: suggestions, is_generating: false }
                : t
            ));
          }
        } catch (aiError) {
          console.error('Error generating AI suggestions:', aiError);
          await supabase
            .from('tasks')
            .update({ is_generating: false })
            .eq('id', task.id);
          
          setTasks(prev => prev.map(t => 
            t.id === task.id 
              ? { ...t, is_generating: false }
              : t
          ));
        }
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = async (task: Task) => {
    if (editingTask) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: editingTask.title,
            description: editingTask.description,
            is_generating: true
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        setTasks(prev => prev.map(t => 
          t.id === editingTask.id 
            ? { ...t, is_generating: true }
            : t
        ));

        const newSuggestions = await getTaskBreakdown(editingTask.description);
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            ai_suggestions: newSuggestions,
            is_generating: false 
          })
          .eq('id', editingTask.id);

        if (!updateError) {
          setTasks(prev => prev.map(t => 
            t.id === editingTask.id 
              ? { ...editingTask, ai_suggestions: newSuggestions, is_generating: false }
              : t
          ));
        }
        setEditingTask(null);
      } catch (error) {
        console.error('Error updating task:', error);
        setTasks(prev => prev.map(t => 
          t.id === editingTask.id 
            ? { ...t, is_generating: false }
            : t
        ));
      }
    } else {
      setEditingTask(task);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, isExpanded: !task.isExpanded } : task
    ));
  };

  const chartData = tasks.reduce((acc: any[], task) => {
    const dateStr = format(new Date(task.date), 'MMM dd');
    const existingDay = acc.find(d => d.date === dateStr);
    if (existingDay) {
      existingDay.tasks += 1;
    } else {
      acc.push({ date: dateStr, tasks: 1 });
    }
    return acc;
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return '';
    }
  };

  const renderTasksList = () => (
    <div className="space-y-4">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-background border-border">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {editingTask?.id === task.id ? 
                        <Input 
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="bg-background border-border"
                        /> : 
                        <>
                          {task.title}
                          <span className={`text-sm ${getPriorityColor(task.priority)}`}>
                            ({task.priority})
                          </span>
                        </>
                      }
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due: {format(new Date(task.date), "PPP")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-muted-foreground">
                      {editingTask?.id === task.id ? 
                        <Textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          className="bg-background border-border"
                        /> :
                        task.description}
                    </p>
                  </div>
                  {(task.ai_suggestions || task.is_generating) && (
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-0 h-8"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <span className="text-sm font-medium">AI Suggestions</span>
                        {task.is_generating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            task.isExpanded && "transform rotate-180"
                          )} />
                        )}
                      </Button>
                      <AnimatePresence>
                        {task.isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-muted/50 p-3 rounded-md mt-2 text-sm text-muted-foreground">
                              {task.is_generating ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                  <span className="ml-2">Generating suggestions...</span>
                                </div>
                              ) : (
                                <pre className="whitespace-pre-wrap font-sans">{task.ai_suggestions}</pre>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <PomodoroTimer />
        {renderTasksList()}
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-purple-400" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              classNames={{
                day_selected: "bg-purple-600 text-white hover:bg-purple-700",
                day_today: "bg-accent text-accent-foreground",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-purple-400" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    stroke="currentColor"
                    className="text-muted-foreground" 
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#9333ea" 
                    fillOpacity={1} 
                    fill="url(#colorTasks)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            AI Task Manager
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Button
            variant={activeView === 'dashboard' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('dashboard')}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeView === 'tasks' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveView('tasks')}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            My Tasks
          </Button>
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold">
              {activeView === 'dashboard' ? 'Dashboard Overview' : 'My Tasks'}
            </h2>
            <div className="flex gap-4 items-center">
              <ThemeToggle />
              <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" /> Add New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="Task Title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="bg-background border-border"
                    />
                    <Textarea
                      placeholder="Task Description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="bg-background border-border"
                    />
                    <Select
                      value={newTask.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                    <Button 
                      onClick={handleAddTask} 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isSubmitting || !date || !newTask.title || !newTask.description}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Task...
                        </>
                      ) : (
                        'Add Task'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {activeView === 'dashboard' ? renderDashboard() : renderTasksList()}
        </div>
      </div>
    </div>
  );
}