'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookReader } from '@/components/books/book-reader';
import { ReadingHistory } from '@/components/books/reading-history';
import { CareerBookmarks } from '@/components/books/career-bookmarks';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { booksApi } from '@/services/books';
import { BookWithProgress, ReadingProgress } from '@/types/book';
import { toast } from 'sonner';
import CareerPlanningPage from './career-planning/page';

type ViewMode = 'read' | 'history' | 'bookmarks' | 'career-planning';

export default function BookPage() {
  const params = useParams();
  const bookId = parseInt(params.id as string);
  const [book, setBook] = useState<BookWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('read');

  useEffect(() => {
    async function loadBook() {
      try {
        const books = await booksApi.getMyLibrary();
        const currentBook = books.find(b => b.id === bookId);
        if (!currentBook) {
          throw new Error('Book not found');
        }
        setBook(currentBook);
      } catch (error) {
        console.error('Failed to load book:', error);
        toast.error('Failed to load book');
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [bookId]);

  const handleProgressUpdate = (progress: ReadingProgress) => {
    if (book) {
      setBook({
        ...book,
        reading_progress: progress
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="large" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Book not found</p>
        <Button onClick={() => window.history.back()}>
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Book Title - Not Sticky */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-4">
          <h1 className="text-2xl font-bold text-slate-900">{book.title}</h1>
          {book.subtitle && (
            <p className="text-slate-600 text-sm">{book.subtitle}</p>
          )}
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 
        backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'read' ? 'default' : 'outline'}
                onClick={() => setViewMode('read')}
                className={`relative px-4 font-medium ${
                  viewMode === 'read' 
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                Read
              </Button>
              <Button
                variant={viewMode === 'history' ? 'default' : 'outline'}
                onClick={() => setViewMode('history')}
                className={`relative px-4 font-medium ${
                  viewMode === 'history'
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                History
              </Button>
              <Button
                variant={viewMode === 'bookmarks' ? 'default' : 'outline'}
                onClick={() => setViewMode('bookmarks')}
                className={`relative px-4 font-medium ${
                  viewMode === 'bookmarks'
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                Bookmarks
              </Button>
              <Button
                variant={viewMode === 'career-planning' ? 'default' : 'outline'}
                onClick={() => setViewMode('career-planning')}
                className={`relative px-4 font-medium ${
                  viewMode === 'career-planning'
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                Career
              </Button>
            </div>

            {/* Reading Progress */}
            {viewMode === 'read' && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">
                  Current Section: 
                  <span className="font-medium text-slate-900 ml-1">
                    {book.reading_progress.current_category}
                  </span>
                </div>
                <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 
                      rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${book.reading_progress.completion_percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  {book.reading_progress.completion_percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'read' && <BookReader bookId={bookId} onProgressUpdate={handleProgressUpdate} />}
        {viewMode === 'history' && (
          <div className="max-w-3xl mx-auto">
            <ReadingHistory bookId={bookId} />
          </div>
        )}
        {viewMode === 'bookmarks' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
              <CareerBookmarks bookId={bookId} />
            </div>
          </div>
        )}
        {viewMode === 'career-planning' && (
          <div className="max-w-3xl mx-auto">
            <CareerPlanningPage />
          </div>
        )}
      </div>
    </div>
  );
} 