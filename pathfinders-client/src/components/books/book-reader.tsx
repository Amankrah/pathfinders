'use client';

import { useEffect, useState, useRef } from 'react';
import { booksApi } from '@/services/books';
import { Category, ReadingProgress } from '@/types/book';
import { Loading } from '@/components/ui/loading';
import { TableOfContents } from './table-of-contents';
import { CareerList } from './career-list';
import { ReadingProgressBar } from './reading-progress-bar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useMobileMenu } from '@/contexts/mobile-menu-context';
import { cn } from '@/lib/utils';

interface BookReaderProps {
  bookId: number;
  onProgressUpdate?: (progress: ReadingProgress) => void;
}

export function BookReader({ bookId, onProgressUpdate }: BookReaderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentProgress, setCurrentProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const readingStartTimeRef = useRef<Date | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const { isMobile } = useMobileMenu();

  useEffect(() => {
    async function initializeReader() {
      try {
        setLoading(true);
        
        // Fetch table of contents first
        const toc = await booksApi.getTableOfContents(bookId);
        if (!toc || toc.length === 0) {
          setError('No content available for this book');
          return;
        }
        setCategories(toc);
        
        // Then fetch current progress
        const progress = await booksApi.getCurrentPosition(bookId);
        setCurrentProgress(progress);
        
        // Set active category
        setActiveCategory(progress?.current_category ? 
          parseInt(progress.current_category) : 
          toc[0]?.id || null
        );
        
      } catch (error) {
        console.error('Failed to initialize reader:', error);
        setError('Failed to load book content. Please try again later.');
        toast.error('Failed to load book content');
      } finally {
        setLoading(false);
      }
    }
    
    initializeReader();
  }, [bookId]);

  useEffect(() => {
    // Start tracking reading time when component mounts
    readingStartTimeRef.current = new Date();

    // Save reading time when component unmounts
    return () => {
      if (readingStartTimeRef.current && activeCategory) {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - readingStartTimeRef.current.getTime()) / 1000);
        
        booksApi.savePosition(bookId, {
          current_category: activeCategory,
          completion_percentage: currentProgress?.completion_percentage || 0,
          last_position: Date.now(),
          read_duration: duration
        }).catch(console.error);
      }
    };
  }, [activeCategory, bookId, currentProgress?.completion_percentage]);

  const handleCategoryChange = async (categoryId: number) => {
    // Save reading time for previous category before changing
    if (readingStartTimeRef.current && activeCategory) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - readingStartTimeRef.current.getTime()) / 1000);
      
      try {
        await booksApi.savePosition(bookId, {
          current_category: activeCategory,
          completion_percentage: currentProgress?.completion_percentage || 0,
          last_position: Date.now(),
          read_duration: duration,
          completed: true
        });
      } catch (error) {
        console.error('Failed to save reading position:', error);
        toast.error('Failed to save your progress');
      }
    }

    setActiveCategory(categoryId);
    if (isMobile) {
      setTocOpen(false);
    }
    readingStartTimeRef.current = new Date();
    try {
      const currentIndex = categories.findIndex(c => c.id === categoryId);
      const previousCategory = categories.find(c => c.id === activeCategory);
      const newProgress = ((currentIndex + 1) / categories.length) * 100;
      
      // Update local progress state
      const updatedProgress = (prev: ReadingProgress | null) => prev ? {
        ...prev,
        current_category: categoryId.toString(),
        completion_percentage: newProgress,
        last_accessed: prev.last_accessed || null
      } : {
        current_category: categoryId.toString(),
        completion_percentage: newProgress,
        last_accessed: null
      };
      
      setCurrentProgress(updatedProgress(currentProgress));
      
      // Notify parent component of progress update
      if (onProgressUpdate) {
        const newProgressObj = updatedProgress(currentProgress);
        onProgressUpdate(newProgressObj);
      }

      await booksApi.savePosition(bookId, {
        current_category: categoryId,
        completion_percentage: newProgress,
        last_position: Date.now(),
        completed: previousCategory ? true : false
      });
    } catch (error) {
      console.error('Failed to save reading position:', error);
      toast.error('Failed to save your progress');
    }
  };

  if (loading) {
    return <Loading size="large" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.history.back()}>
          Return to Library
        </Button>
      </div>
    );
  }

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50">
      {/* Mobile ToC Toggle Button */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="p-3 bg-indigo-600 text-white rounded-full shadow-lg"
            aria-label={tocOpen ? "Close table of contents" : "Open table of contents"}
          >
            {tocOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      )}

      {/* Left sidebar - Table of Contents */}
      <div 
        className={cn(
          "bg-white shadow-lg p-4 overflow-y-auto transition-all duration-300 ease-in-out",
          "scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300",
          isMobile 
            ? tocOpen 
              ? "fixed top-0 left-0 h-full w-80 z-50"
              : "hidden"
            : "w-64 border-r border-slate-200"
        )}
      >
        {isMobile && tocOpen && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Table of Contents</h2>
            <button 
              onClick={() => setTocOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <TableOfContents 
          categories={categories}
          activeCategory={activeCategory}
          onCategorySelect={handleCategoryChange}
        />
      </div>

      {/* Overlay for mobile ToC */}
      {isMobile && tocOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ease-in-out"
          onClick={() => setTocOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <ReadingProgressBar 
          progress={currentProgress?.completion_percentage || 0}
          category={currentCategory?.title || ''}
        />
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentCategory && (
            <div className="max-w-5xl mx-auto">
              {/* Category Header */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                  {currentCategory.title}
                </h1>
                <div className="flex items-center text-slate-600 border-b border-slate-200 pb-4 sm:pb-6">
                  <span className="text-sm font-medium">
                    Section {categories.findIndex(c => c.id === currentCategory.id) + 1} of {categories.length}
                  </span>
                </div>
              </div>

              {/* Main Content with improved typography and spacing */}
              <div className="prose max-w-none mb-8 sm:mb-12">
                <div className="text-slate-700 text-base sm:text-lg leading-relaxed space-y-4 sm:space-y-6 
                  bg-white rounded-xl shadow-sm border border-slate-200/50 p-4 sm:p-8"
                >
                  {currentCategory.description.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="text-base sm:text-lg text-slate-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
                
              {/* Careers Section */}
              {currentCategory.careers.length > 0 && (
                <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      Career Opportunities
                    </h2>
                    <p className="mt-1 text-slate-300 text-xs sm:text-sm">
                      Explore potential career paths in {currentCategory.title}
                    </p>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <CareerList 
                      careers={currentCategory.careers}
                      bookId={bookId}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-slate-200 flex justify-between items-center">
                {categories.findIndex(c => c.id === currentCategory.id) > 0 && (
                  <Button
                    onClick={() => {
                      const prevIndex = categories.findIndex(c => c.id === currentCategory.id) - 1;
                      if (prevIndex >= 0) {
                        handleCategoryChange(categories[prevIndex].id);
                      }
                    }}
                    variant="outline"
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white border-0 hover:bg-slate-800 
                      transition-all duration-200 rounded-xl text-sm sm:text-base"
                  >
                    ← Previous Section
                  </Button>
                )}
                {categories.findIndex(c => c.id === currentCategory.id) < categories.length - 1 && (
                  <Button
                    onClick={() => {
                      const nextIndex = categories.findIndex(c => c.id === currentCategory.id) + 1;
                      if (nextIndex < categories.length) {
                        handleCategoryChange(categories[nextIndex].id);
                      }
                    }}
                    className="ml-auto px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
                  >
                    Next Section →
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 