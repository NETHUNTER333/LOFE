/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Book } from '../services/geminiService';

interface BookFinderDisplayProps {
  books: Book[];
}

const BookFinderDisplay: React.FC<BookFinderDisplayProps> = ({ books }) => {
  if (books.length === 0) {
    return (
      <p>No relevant books or resources could be found for this topic.</p>
    );
  }

  return (
    <div className="book-finder-container">
      <h3>Related Books & Resources</h3>
      {books.map((book, index) => (
        <article key={index} className="book-finder-item">
          <h4 className="book-title">{book.title}</h4>
          <p className="book-authors">{(Array.isArray(book.authors) ? book.authors : [book.authors]).filter(Boolean).join(', ')}</p>
          <p className="book-description">{book.description}</p>
          <a href={book.link} target="_blank" rel="noopener noreferrer" className="book-link" download>
            Download PDF
          </a>
        </article>
      ))}
    </div>
  );
};

export default BookFinderDisplay;