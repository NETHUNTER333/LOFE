/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import { DebateTurn, Quiz, MindMapData, Book, Flashcard } from '../services/geminiService';

// Tell TypeScript about the global jspdf object from the script tag
declare global {
  interface Window {
    jspdf: any;
  }
}

interface DownloadPopupProps {
  topic: string;
  content: string;
  debateTurns: DebateTurn[];
  quizData: Quiz | null;
  mindMapData: MindMapData | null;
  bookListData: Book[] | null;
  flashcardsData: Flashcard[] | null;
  onClose: () => void;
}

const DownloadPopup: React.FC<DownloadPopupProps> = ({ 
  topic, 
  content, 
  debateTurns, 
  quizData,
  mindMapData,
  bookListData,
  flashcardsData,
  onClose 
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const formatContentForDownload = (): string => {
    let text = `Topic: ${topic}\n\n`;

    if (debateTurns.length > 0) {
      text += "--- DEBATE ---\n\n";
      text += debateTurns.map(turn => `${turn.agentName}:\n${turn.statement}`).join('\n\n---\n\n');
    } else if (quizData) {
      text += `--- QUIZ: ${quizData.title} ---\n\n`;
      text += quizData.questions.map((q, i) => 
        `Question ${i + 1}: ${q.question}\n` + 
        q.options.map(opt => `- ${opt}`).join('\n') +
        `\nAnswer: ${q.answer}`
      ).join('\n\n');
    } else if (flashcardsData) {
      text += `--- FLASHCARDS ---\n\n`;
      text += flashcardsData.map(card => 
        `Q: ${card.question}\n` +
        `A: ${card.answer}`
      ).join('\n\n---\n\n');
    } else if (mindMapData) {
      text += "--- MIND MAP ---\n\n";
      mindMapData.nodes.forEach(node => {
        text += `[${node.type.replace(/_/g, ' ').toUpperCase()}] ${node.title}\n`;
        text += `${node.content}\n\n`;
      });
    } else if (bookListData) {
        text += "--- RELATED BOOKS & RESOURCES ---\n\n";
        text += bookListData.map(book => 
            `${book.title}\n` +
            `Authors: ${(Array.isArray(book.authors) ? book.authors : [book.authors]).filter(Boolean).join(', ')}\n` +
            `${book.description}\n` +
            `Link: ${book.link}`
        ).join('\n\n---\n\n');
    } else {
      text += content;
    }
    return text;
  };

  const getFilename = (extension: string): string => {
    return `${topic.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}.${extension}`;
  };

  const handleDownloadTxt = () => {
    const textContent = formatContentForDownload();
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFilename('txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleDownloadPdf = () => {
    if (!window.jspdf) {
      console.error("jsPDF is not loaded.");
      alert("PDF generation library is not available.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    let y = margin + 10;
    
    const addText = (text: string, size: number, style: string, options = {}) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const splitText = doc.splitTextToSize(text, usableWidth);
        doc.text(splitText, margin, y, options);
        y += doc.getTextDimensions(splitText).h + 5;
    };

    addText(topic, 18, 'bold');
    y += 5;

    if (debateTurns.length > 0) {
      debateTurns.forEach(turn => {
        addText(turn.agentName, 14, 'bold');
        addText(turn.statement, 12, 'normal');
        y += 5;
      });
    } else if (quizData) {
      addText(quizData.title, 14, 'bold');
      quizData.questions.forEach((q, i) => {
        addText(`Question ${i + 1}: ${q.question}`, 12, 'bold');
        addText(q.options.map(opt => `- ${opt}`).join('\n'), 12, 'normal');
        addText(`Answer: ${q.answer}`, 12, 'italic');
        y += 5;
      });
    } else if (flashcardsData) {
      addText('Flashcards', 14, 'bold');
      flashcardsData.forEach(card => {
        addText(`Q: ${card.question}`, 12, 'bold');
        addText(`A: ${card.answer}`, 12, 'normal');
        y += 5;
      });
    } else if (mindMapData) {
      mindMapData.nodes.forEach(node => {
        addText(`[${node.type.replace(/_/g, ' ')}] ${node.title}`, 14, 'bold');
        addText(node.content, 12, 'normal');
        y += 5;
      });
    } else if (bookListData) {
        bookListData.forEach(book => {
            addText(book.title, 14, 'bold');
            addText(`Authors: ${(Array.isArray(book.authors) ? book.authors : [book.authors]).filter(Boolean).join(', ')}`, 10, 'italic');
            addText(book.description, 12, 'normal');
            y+= 5;
        });
    } else {
      addText(content, 12, 'normal');
    }
    
    doc.save(getFilename('pdf'));
    onClose();
  };

  return (
    <div className="download-popup" ref={popupRef}>
      <p>Download As:</p>
      <div className="download-options">
        <button onClick={handleDownloadTxt}>Text (.txt)</button>
        <button onClick={handleDownloadPdf}>PDF (.pdf)</button>
      </div>
      <button onClick={onClose} className="close-popup-btn" aria-label="Close download options">&times;</button>
    </div>
  );
};

export default DownloadPopup;