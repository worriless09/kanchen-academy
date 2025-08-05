// components/features/QuizBuilder.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Settings, 
  FileText, 
  Clock, 
  Brain,
  Target,
  Shuffle,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Types and Interfaces
interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'true_false' | 'fill_blank' | 'essay' | 'numerical';
  explanation: string;
  difficulty_level: number;
  marks: number;
  negative_marks: number;
  estimated_time: number;
  cognitive_load: number;
  reasoning_type: string;
  topic: string;
  tags: string[];
  image_url?: string;
  options: QuizOption[];
  correct_answer?: string; // For non-MCQ questions
  is_active: boolean;
}

interface QuizOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  explanation?: string;
  image_url?: string;
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  subject_id: string;
  category_id: string;
  total_questions: number;
  total_marks: number;
  time_limit: number;
  passing_marks: number;
  negative_marking: number;
  question_randomization: boolean;
  option_randomization: boolean;
  allow_review: boolean;
  show_results_immediately: boolean;
  allow_retake: boolean;
  max_attempts: number;
  adaptive_difficulty: boolean;
  reasoning_analysis_enabled: boolean;
  is_public: boolean;
  requires_enrollment: boolean;
  is_free: boolean;
  price: number;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'published' | 'archived';
  questions: QuizQuestion[];
}

interface QuizBuilderProps {
  initialQuiz?: Partial<Quiz>;
  subjects: Array<{ id: string; name: string; code: string }>;
  categories: Array<{ id: string; name: string; category_type: string }>;
  onSave: (quiz: Quiz) => Promise<void>;
  onPreview: (quiz: Quiz) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultQuestion: Omit<QuizQuestion, 'id'> = {
  question_text: '',
  question_type: 'mcq',
  explanation: '',
  difficulty_level: 1,
  marks: 1,
  negative_marks: 0.25,
  estimated_time: 60,
  cognitive_load: 0.5,
  reasoning_type: 'analytical',
  topic: '',
  tags: [],
  options: [
    { id: '1', option_text: '', is_correct: false },
    { id: '2', option_text: '', is_correct: false },
    { id: '3', option_text: '', is_correct: false },
    { id: '4', option_text: '', is_correct: false }
  ],
  is_active: true
};

const defaultQuiz: Quiz = {
  title: '',
  description: '',
  instructions: '',
  subject_id: '',
  category_id: '',
  total_questions: 0,
  total_marks: 0,
  time_limit: 60,
  passing_marks: 0,
  negative_marking: 0.25,
  question_randomization: true,
  option_randomization: true,
  allow_review: true,
  show_results_immediately: false,
  allow_retake: true,
  max_attempts: 3,
  adaptive_difficulty: false,
  reasoning_analysis_enabled: true,
  is_public: false,
  requires_enrollment: false,
  is_free: true,
  price: 0,
  status: 'draft',
  questions: []
};

export default function QuizBuilder({
  initialQuiz,
  subjects,
  categories,
  onSave,
  onPreview,
  onCancel,
  isLoading = false
}: QuizBuilderProps) {

  const [quiz, setQuiz] = useState<Quiz>({ ...defaultQuiz, ...initialQuiz });
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Update quiz totals when questions change
  const updateQuizTotals = useCallback((questions: QuizQuestion[]) => {
    const totalQuestions = questions.filter(q => q.is_active).length;
    const totalMarks = questions
      .filter(q => q.is_active)
      .reduce((sum, q) => sum + q.marks, 0);

    setQuiz(prev => ({
      ...prev,
      total_questions: totalQuestions,
      total_marks: totalMarks,
      questions
    }));
  }, []);

  // Add new question
  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestion = {
      ...defaultQuestion,
      id: `temp_${Date.now()}`,
      topic: quiz.title
    };

    const updatedQuestions = [...quiz.questions, newQuestion];
    updateQuizTotals(updatedQuestions);
    setSelectedQuestionIndex(updatedQuestions.length - 1);
  }, [quiz.questions, quiz.title, updateQuizTotals]);

  // Update question
  const updateQuestion = useCallback((index: number, updates: Partial<QuizQuestion>) => {
    const updatedQuestions = quiz.questions.map((q, i) => 
      i === index ? { ...q, ...updates } : q
    );
    updateQuizTotals(updatedQuestions);
  }, [quiz.questions, updateQuizTotals]);

  // Delete question
  const deleteQuestion = useCallback((index: number) => {
    const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
    updateQuizTotals(updatedQuestions);
    setSelectedQuestionIndex(null);
  }, [quiz.questions, updateQuizTotals]);

  // Add option to question
  const addOption = useCallback((questionIndex: number) => {
    const question = quiz.questions[questionIndex];
    const newOption: QuizOption = {
      id: `temp_${Date.now()}`,
      option_text: '',
      is_correct: false
    };

    updateQuestion(questionIndex, {
      options: [...question.options, newOption]
    });
  }, [quiz.questions, updateQuestion]);

  // Update option
  const updateOption = useCallback((questionIndex: number, optionIndex: number, updates: Partial<QuizOption>) => {
    const question = quiz.questions[questionIndex];
    const updatedOptions = question.options.map((opt, i) => 
      i === optionIndex ? { ...opt, ...updates } : opt
    );

    updateQuestion(questionIndex, { options: updatedOptions });
  }, [quiz.questions, updateQuestion]);

  // Delete option
  const deleteOption = useCallback((questionIndex: number, optionIndex: number) => {
    const question = quiz.questions[questionIndex];
    if (question.options.length <= 2) {
      toast.error('Question must have at least 2 options');
      return;
    }

    const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: updatedOptions });
  }, [quiz.questions, updateQuestion]);

  // Mark option as correct (for MCQ)
  const markCorrectOption = useCallback((questionIndex: number, optionIndex: number) => {
    const question = quiz.questions[questionIndex];
    const updatedOptions = question.options.map((opt, i) => ({
      ...opt,
      is_correct: question.question_type === 'mcq' ? i === optionIndex : 
                   question.question_type === 'multiple_select' ? 
                   (i === optionIndex ? !opt.is_correct : opt.is_correct) : opt.is_correct
    }));

    updateQuestion(questionIndex, { options: updatedOptions });
  }, [quiz.questions, updateQuestion]);

  // Validate quiz
  const validateQuiz = useCallback((): string[] => {
    const errors: string[] = [];

    if (!quiz.title.trim()) errors.push('Quiz title is required');
    if (!quiz.subject_id) errors.push('Subject is required');
    if (!quiz.category_id) errors.push('Category is required');
    if (quiz.questions.length === 0) errors.push('At least one question is required');
    if (quiz.time_limit <= 0) errors.push('Time limit must be greater than 0');
    if (quiz.passing_marks < 0) errors.push('Passing marks cannot be negative');

    quiz.questions.forEach((question, index) => {
      if (!question.question_text.trim()) {
        errors.push(`Question ${index + 1}: Question text is required`);
      }

      if (['mcq', 'multiple_select'].includes(question.question_type)) {
        if (question.options.length < 2) {
          errors.push(`Question ${index + 1}: At least 2 options required`);
        }

        const correctOptions = question.options.filter(opt => opt.is_correct);
        if (correctOptions.length === 0) {
          errors.push(`Question ${index + 1}: At least one correct option required`);
        }

        if (question.question_type === 'mcq' && correctOptions.length > 1) {
          errors.push(`Question ${index + 1}: MCQ can have only one correct option`);
        }
      }

      if (question.marks <= 0) {
        errors.push(`Question ${index + 1}: Marks must be greater than 0`);
      }
    });

    return errors;
  }, [quiz]);

  // Handle save
  const handleSave = useCallback(async () => {
    const errors = validateQuiz();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error(`Please fix ${errors.length} validation error(s)`);
      return;
    }

    try {
      await onSave(quiz);
      toast.success('Quiz saved successfully');
    } catch (error) {
      toast.error('Failed to save quiz');
      console.error('Save error:', error);
    }
  }, [quiz, validateQuiz, onSave]);

  // Handle preview
  const handlePreview = useCallback(() => {
    const errors = validateQuiz();
    if (errors.length > 0) {
      toast.error('Please fix validation errors before preview');
      return;
    }
    onPreview(quiz);
  }, [quiz, validateQuiz, onPreview]);

  // Import questions from file
  const handleImportQuestions = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          const importedQuestions = data.map((q, i) => ({
            ...defaultQuestion,
            ...q,
            id: `imported_${Date.now()}_${i}`
          }));
          updateQuizTotals([...quiz.questions, ...importedQuestions]);
          toast.success(`Imported ${importedQuestions.length} questions`);
        }
      } catch (error) {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
  }, [quiz.questions, updateQuizTotals]);

  // Export questions to file
  const handleExportQuestions = useCallback(() => {
    const exportData = quiz.questions.map(({ id, ...question }) => question);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quiz.title || 'quiz'}_questions.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [quiz.questions, quiz.title]);

  // Render validation errors
  const renderValidationErrors = () => {
    if (validationErrors.length === 0) return null;

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Validation Errors ({validationErrors.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // Render basic info tab
  const renderBasicInfoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Quiz Title *</Label>
          <Input
            id="title"
            value={quiz.title}
            onChange={(e: { target: { value: any; }; }) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter quiz title"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Select 
            value={quiz.subject_id} 
            onValueChange={(value: any) => setQuiz(prev => ({ ...prev, subject_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={quiz.description}
          onChange={(e: { target: { value: any; }; }) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the quiz"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          value={quiz.instructions}
          onChange={(e: { target: { value: any; }; }) => setQuiz(prev => ({ ...prev, instructions: e.target.value }))}
          placeholder="Instructions for students taking the quiz"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={quiz.category_id} 
            onValueChange={(value: any) => setQuiz(prev => ({ ...prev, category_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time_limit">Time Limit (minutes) *</Label>
          <Input
            id="time_limit"
            type="number"
            min="1"
            value={quiz.time_limit}
            onChange={(e: { target: { value: string; }; }) => setQuiz(prev => ({ 
              ...prev, 
              time_limit: parseInt(e.target.value) || 0 
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passing_marks">Passing Marks</Label>
          <Input
            id="passing_marks"
            type="number"
            min="0"
            value={quiz.passing_marks}
            onChange={(e: { target: { value: string; }; }) => setQuiz(prev => ({ 
              ...prev, 
              passing_marks: parseFloat(e.target.value) || 0 
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="negative_marking">Negative Marking</Label>
          <Input
            id="negative_marking"
            type="number"
            step="0.25"
            min="0"
            value={quiz.negative_marking}
            onChange={(e: { target: { value: string; }; }) => setQuiz(prev => ({ 
              ...prev, 
              negative_marking: parseFloat(e.target.value) || 0 
            }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_attempts">Max Attempts</Label>
          <Input
            id="max_attempts"
            type="number"
            min="1"
            value={quiz.max_attempts}
            onChange={(e: { target: { value: string; }; }) => setQuiz(prev => ({ 
              ...prev, 
              max_attempts: parseInt(e.target.value) || 1 
            }))}
          />
        </div>
      </div>
    </div>
  );

  // Render quiz settings tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quiz Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Question Randomization</Label>
              <p className="text-xs text-gray-600">Randomize question order for each attempt</p>
            </div>
            <Switch
              checked={quiz.question_randomization}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                question_randomization: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Option Randomization</Label>
              <p className="text-xs text-gray-600">Randomize option order within questions</p>
            </div>
            <Switch
              checked={quiz.option_randomization}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                option_randomization: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow Review</Label>
              <p className="text-xs text-gray-600">Students can review answers before submission</p>
            </div>
            <Switch
              checked={quiz.allow_review}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                allow_review: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Results Immediately</Label>
              <p className="text-xs text-gray-600">Display results right after submission</p>
            </div>
            <Switch
              checked={quiz.show_results_immediately}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                show_results_immediately: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow Retake</Label>
              <p className="text-xs text-gray-600">Students can retake the quiz</p>
            </div>
            <Switch
              checked={quiz.allow_retake}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                allow_retake: checked 
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* HRM Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Adaptive Difficulty</Label>
              <p className="text-xs text-gray-600">Adjust question difficulty based on performance</p>
            </div>
            <Switch
              checked={quiz.adaptive_difficulty}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                adaptive_difficulty: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Reasoning Analysis</Label>
              <p className="text-xs text-gray-600">Enable HRM analysis of student responses</p>
            </div>
            <Switch
              checked={quiz.reasoning_analysis_enabled}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                reasoning_analysis_enabled: checked 
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Access & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Public Quiz</Label>
              <p className="text-xs text-gray-600">Anyone can access this quiz</p>
            </div>
            <Switch
              checked={quiz.is_public}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                is_public: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Requires Enrollment</Label>
              <p className="text-xs text-gray-600">Students must enroll in course to access</p>
            </div>
            <Switch
              checked={quiz.requires_enrollment}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                requires_enrollment: checked 
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Free Quiz</Label>
              <p className="text-xs text-gray-600">No payment required</p>
            </div>
            <Switch
              checked={quiz.is_free}
              onCheckedChange={(checked: any) => setQuiz(prev => ({ 
                ...prev, 
                is_free: checked 
              }))}
            />
          </div>

          {!quiz.is_free && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={quiz.price}
                onChange={(e: { target: { value: string; }; }) => setQuiz(prev => ({ 
                  ...prev, 
                  price: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render questions tab with full question editor
  const renderQuestionsTab = () => (
    <div className="space-y-4">
      {/* Question management header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questions ({quiz.questions.length})</h3>
          <p className="text-sm text-gray-600">
            Total Marks: {quiz.total_marks} | Estimated Time: {
              Math.ceil(quiz.questions.reduce((sum, q) => sum + q.estimated_time, 0) / 60)
            } minutes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportQuestions}
            className="hidden"
            id="import-questions"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-questions')?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportQuestions}
            disabled={quiz.questions.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Button onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>
      </div>

      {quiz.questions.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-600 mb-4">Start building your quiz by adding questions</p>
          <Button onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Add First Question
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions list */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Questions</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quiz.questions.map((question, index) => (
                <Card
                  key={question.id}
                  className={cn(
                    "p-3 cursor-pointer transition-colors",
                    selectedQuestionIndex === index 
                      ? "border-blue-500 bg-blue-50" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedQuestionIndex(index)}
                >
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">
                      Q{index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">
                        {question.question_text || 'Untitled question'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-xs" variant="secondary">
                          {question.question_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {question.marks} marks
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(index);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Question editor */}
          <div className="lg:col-span-2">
            {selectedQuestionIndex !== null && (
              <QuestionEditor
                question={quiz.questions[selectedQuestionIndex]}
                questionIndex={selectedQuestionIndex}
                onUpdate={updateQuestion}
                onAddOption={addOption}
                onUpdateOption={updateOption}
                onDeleteOption={deleteOption}
                onMarkCorrect={markCorrectOption}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz Builder</h1>
          <p className="text-gray-600">
            Create and manage quiz content with AI-powered features
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-1" />
            {isLoading ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>
      </div>

      {/* Validation errors */}
      {renderValidationErrors()}

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({quiz.questions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              {renderBasicInfoTab()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {renderSettingsTab()}
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          {renderQuestionsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: QuizQuestion;
  questionIndex: number;
  onUpdate: (index: number, updates: Partial<QuizQuestion>) => void;
  onAddOption: (questionIndex: number) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, updates: Partial<QuizOption>) => void;
  onDeleteOption: (questionIndex: number, optionIndex: number) => void;
  onMarkCorrect: (questionIndex: number, optionIndex: number) => void;
}

function QuestionEditor({
  question,
  questionIndex,
  onUpdate,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onMarkCorrect
}: QuestionEditorProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Question {questionIndex + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question text */}
        <div className="space-y-2">
          <Label>Question Text *</Label>
          <Textarea
            value={question.question_text}
            onChange={(e: { target: { value: any; }; }) => onUpdate(questionIndex, { question_text: e.target.value })}
            placeholder="Enter your question here..."
            rows={3}
          />
        </div>

        {/* Question metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={question.question_type}
              onValueChange={(value: string) => onUpdate(questionIndex, { 
                question_type: value as QuizQuestion['question_type'] 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice</SelectItem>
                <SelectItem value="multiple_select">Multiple Select</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="fill_blank">Fill in Blank</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="numerical">Numerical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={question.difficulty_level.toString()}
              onValueChange={(value: string) => onUpdate(questionIndex, { 
                difficulty_level: parseInt(value) 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Very Easy</SelectItem>
                <SelectItem value="2">2 - Easy</SelectItem>
                <SelectItem value="3">3 - Medium</SelectItem>
                <SelectItem value="4">4 - Hard</SelectItem>
                <SelectItem value="5">5 - Very Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Marks</Label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              value={question.marks}
              onChange={(e: { target: { value: string; }; }) => onUpdate(questionIndex, { 
                marks: parseFloat(e.target.value) || 1 
              })}
            />
          </div>

          <div className="space-y-2">
            <Label>Time (sec)</Label>
            <Input
              type="number"
              min="30"
              value={question.estimated_time}
              onChange={(e: { target: { value: string; }; }) => onUpdate(questionIndex, { 
                estimated_time: parseInt(e.target.value) || 60 
              })}
            />
          </div>
        </div>

        {/* Options for MCQ/Multiple Select */}
        {['mcq', 'multiple_select', 'true_false'].includes(question.question_type) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              {question.question_type !== 'true_false' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddOption(questionIndex)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Button
                    variant={option.is_correct ? "default" : "outline"}
                    size="sm"
                    onClick={() => onMarkCorrect(questionIndex, optionIndex)}
                    className="flex-shrink-0"
                  >
                    {option.is_correct ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="w-4 h-4 border border-current rounded-full" />
                    )}
                  </Button>

                  <Input
                    value={option.option_text}
                    onChange={(e: { target: { value: any; }; }) => onUpdateOption(questionIndex, optionIndex, {
                      option_text: e.target.value
                    })}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-1"
                  />

                  {question.question_type !== 'true_false' && question.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteOption(questionIndex, optionIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="space-y-2">
          <Label>Explanation</Label>
          <Textarea
            value={question.explanation}
            onChange={(e: { target: { value: any; }; }) => onUpdate(questionIndex, { explanation: e.target.value })}
            placeholder="Explain the correct answer and why other options are incorrect..."
            rows={3}
          />
        </div>

        {/* Topic and tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              value={question.topic}
              onChange={(e: { target: { value: any; }; }) => onUpdate(questionIndex, { topic: e.target.value })}
              placeholder="Question topic"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input
              value={question.tags.join(', ')}
              onChange={(e: { target: { value: string; }; }) => onUpdate(questionIndex, { 
                tags: e.target.value.split(',').map((tag: string) => tag.trim()).filter(Boolean)
              })}
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { Quiz, QuizQuestion, QuizOption };
