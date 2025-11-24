import React, { useState } from 'react';
import { GeneratedContent, ViewMode } from '../types';
import { FileText, Users, Briefcase, Copy, Check, Share2, Link, DownloadCloud, Mail, CopyPlus, ImageIcon, ThumbsUp, ThumbsDown } from './Icons';
import { jsPDF } from "jspdf";

interface ResultDisplayProps {
  content: GeneratedContent;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let listBuffer: React.ReactNode[] = [];
  let inList = false;

  let codeBuffer: string[] = [];
  let inCodeBlock = false;

  let tableBuffer: string[] = [];

  const flushList = (keyPrefix: number) => {
    if (inList && listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${keyPrefix}`} className="list-disc pl-5 mb-4 space-y-2 text-slate-700">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
      inList = false;
    }
  };

  const renderTable = (rows: string[], keyPrefix: number) => {
    if (rows.length < 2) return null;
    
    const parseRow = (row: string) => 
      row.split('|')
         .map(c => c.trim())
         .filter((_, i, arr) => i !== 0 && i !== arr.length - 1); // remove empty start/end if pipe bordered

    const headers = parseRow(rows[0]);
    // Row 1 is usually separator |---|---|
    const bodyRows = rows.slice(2).map(parseRow);

    return (
      <div key={`table-${keyPrefix}`} className="overflow-x-auto mb-6 rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {bodyRows.map((row, rI) => (
              <tr key={rI}>
                {row.map((cell, cI) => (
                  <td key={cI} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const flushTable = (keyPrefix: number) => {
    if (tableBuffer.length > 0) {
      elements.push(renderTable(tableBuffer, keyPrefix));
      tableBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code Blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${index}`} className="mb-4 rounded-lg overflow-hidden border border-slate-700">
            <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 border-b border-slate-700 flex items-center gap-2">
               <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
               </div>
               <span>Code Snippet</span>
            </div>
            <pre className="bg-slate-900 text-slate-50 p-4 overflow-x-auto text-sm font-mono">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Tables
    if (trimmed.startsWith('|')) {
      flushList(index);
      tableBuffer.push(trimmed);
      return;
    } else {
      flushTable(index);
    }

    // Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const text = trimmed.substring(2);
      const parts = text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      listBuffer.push(<li key={`li-${index}`}>{parts}</li>);
      return;
    }

    flushList(index);

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2"><div className="h-1 w-6 bg-indigo-500 rounded-full"></div>{trimmed.substring(4)}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">{trimmed.substring(3)}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold text-slate-900 mt-2 mb-4">{trimmed.substring(2)}</h1>);
    } 
    // Paragraphs
    else if (trimmed) {
       const parts = trimmed.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      elements.push(<p key={index} className="mb-4 text-slate-700 leading-relaxed">{parts}</p>);
    }
  });

  flushList(lines.length);
  flushTable(lines.length);

  return <div className="markdown-content">{elements}</div>;
};

// --- Banner Generator ---
const generateBannerStyle = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  const h3 = (h1 + 200) % 360;

  return {
    background: `
      radial-gradient(circle at 10% 20%, hsla(${h1}, 70%, 60%, 0.8) 0%, transparent 20%),
      radial-gradient(circle at 90% 80%, hsla(${h2}, 70%, 50%, 0.8) 0%, transparent 20%),
      linear-gradient(135deg, hsl(${h1}, 80%, 90%), hsl(${h3}, 30%, 95%))
    `
  };
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ content }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('JD');
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [shared, setShared] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // New state for individual question copy
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);
  
  // New state for feedback
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const bannerStyle = generateBannerStyle(content.jobTitle);

  const handleCopy = () => {
    const textToCopy = viewMode === 'JD' 
      ? content.jobDescription 
      : content.interviewGuide.map(q => `Q: ${q.question}\nFocus: ${q.focusArea}\nRationale: ${q.rationale}`).join('\n\n');
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    const allText = `JOB TITLE: ${content.jobTitle}\n\n=== JOB DESCRIPTION ===\n\n${content.jobDescription}\n\n=== INTERVIEW GUIDE ===\n\n` + 
      content.interviewGuide.map((q, i) => `${i+1}. ${q.question}\n   Focus: ${q.focusArea}\n   Rationale: ${q.rationale}`).join('\n\n');
    
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  const handleShare = () => {
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const mockUrl = `https://recruitai.sandbox/share/${uniqueId}`;
    navigator.clipboard.writeText(mockUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleEmailShare = () => {
     const subject = encodeURIComponent(`Recruitment Package: ${content.jobTitle}`);
     const body = encodeURIComponent(
      `Here is the recruitment package for the ${content.jobTitle} role.\n\n` +
      `Check it out here: https://recruitai.sandbox/share/${Math.random().toString(36).substring(2, 8)}\n\n` +
      `-- Generated by RecruitAI`
     );
     window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2000);
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = 20;
        }
      };

      // Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229); // Indigo
      const titleLines = doc.splitTextToSize(content.jobTitle, contentWidth);
      doc.text(titleLines, margin, y);
      y += (titleLines.length * 8) + 15;

      // Job Description Section
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Job Description", margin, y);
      y += 12;

      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // Slate-700
      
      const lines = content.jobDescription.split('\n');
      lines.forEach(line => {
        let text = line.trim();
        if (!text) {
          y += 6; 
          return;
        }

        let fontSize = 11;
        let fontType = "normal";
        let xOffset = 0;
        let textColor = [51, 65, 85];
        let lineHeight = 5.5; // Better spacing

        if (text.startsWith('### ')) {
          text = text.replace('### ', '');
          fontSize = 12;
          fontType = "bold";
          textColor = [30, 41, 59];
          y += 5;
          lineHeight = 6;
        } else if (text.startsWith('## ')) {
           text = text.replace('## ', '');
           fontSize = 14;
           fontType = "bold";
           textColor = [30, 41, 59];
           y += 8;
           lineHeight = 7;
        } else if (text.startsWith('# ')) {
           text = text.replace('# ', '');
           fontSize = 16;
           fontType = "bold";
           textColor = [30, 41, 59];
           y += 10;
           lineHeight = 8;
        } else if (text.startsWith('- ') || text.startsWith('* ')) {
          text = '•  ' + text.substring(2);
          xOffset = 5;
        } else if (text.startsWith('|')) {
           // Simple table fallback for PDF
           text = text.replace(/\|/g, '  '); 
           fontSize = 9;
           fontType = "courier";
        }

        text = text.replace(/\*\*/g, '');

        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontType);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        const textLines = doc.splitTextToSize(text, contentWidth - xOffset);
        checkPageBreak(textLines.length * lineHeight);
        
        doc.text(textLines, margin + xOffset, y);
        y += textLines.length * lineHeight;
      });

      // Interview Guide Section
      doc.addPage();
      y = 20;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("Interview Guide", margin, y);
      y += 15;

      content.interviewGuide.forEach((q, i) => {
        checkPageBreak(45); 

        // Question
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        const qLines = doc.splitTextToSize(`${i + 1}. ${q.question}`, contentWidth);
        doc.text(qLines, margin, y);
        y += (qLines.length * 6) + 4;

        // Focus
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(79, 70, 229); 
        doc.text(`Focus: ${q.focusArea}`, margin + 5, y);
        y += 6;

        // Rationale
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105); 
        const rLines = doc.splitTextToSize(`Rationale: ${q.rationale}`, contentWidth - 5);
        doc.text(rLines, margin + 5, y);
        y += (rLines.length * 5) + 12; // Extra space between items
      });

      doc.save(`${content.jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recruitai.pdf`);
    } catch (e) {
      console.error("PDF Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header / Tabs */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">{content.jobTitle}</h2>
           <p className="text-sm text-slate-500">AI Generated Recruitment Package</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('JD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'JD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Job Description
          </button>
          <button
            onClick={() => setViewMode('GUIDE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'GUIDE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Interview Guide
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-white relative">
        
        {/* Placeholder Banner Image */}
        <div 
          className="w-full h-32 relative overflow-hidden flex items-center justify-center"
          style={bannerStyle}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center gap-2 text-white/90 font-medium px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
             <ImageIcon className="w-4 h-4" />
             <span className="text-sm">Generated Placeholder Visual</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 relative min-h-[500px]">
          {/* Action Bar */}
          <div className="absolute top-6 right-6 flex gap-2 z-20">
             <button 
              onClick={handleExportPDF}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
              title="Export as PDF"
              disabled={exporting}
            >
               <DownloadCloud className={`w-5 h-5 ${exporting ? 'animate-bounce text-indigo-500' : ''}`} />
            </button>

             <button 
              onClick={handleEmailShare}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
              title="Share via Email"
            >
              <Mail className="w-5 h-5" />
            </button>

            <button 
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-sm flex items-center gap-2 group relative"
              title="Share Link"
            >
              {shared ? <Link className="w-5 h-5 text-indigo-600" /> : <Share2 className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={handleCopyAll}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
              title="Copy All Content"
            >
              {copiedAll ? <Check className="w-5 h-5 text-green-500" /> : <CopyPlus className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 shadow-sm"
              title={`Copy ${viewMode === 'JD' ? 'Job Description' : 'Questions'}`}
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          {viewMode === 'JD' ? (
            <div className="prose prose-slate max-w-3xl mx-auto mt-4">
              <MarkdownRenderer content={content.jobDescription} />
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto mt-4">
              <div className="mb-6 p-4 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-100 text-sm">
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4" />
                  Interviewer Note
                </h4>
                Use these behavioral questions to assess the candidate's fit for the specific requirements outlined in the Job Description.
              </div>
              
              <div className="grid gap-6">
                {content.interviewGuide.map((item, index) => (
                  <div key={index} className="p-6 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all bg-slate-50/50">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {item.question}
                          </h3>
                          <button
                            onClick={() => handleCopyQuestion(item.question, index)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Copy Question"
                          >
                            {copiedQuestionIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                             Focus: {item.focusArea}
                          </span>
                        </div>

                        <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 mt-2">
                          <span className="font-medium text-slate-900">Why ask this: </span>
                          {item.rationale}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Mechanism */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col items-center justify-center gap-3 pb-8">
            <span className="text-sm text-slate-500 font-medium">Was this result helpful?</span>
            <div className="flex gap-4">
              <button 
                onClick={() => setFeedback('up')} 
                className={`p-3 rounded-full transition-all duration-200 ${
                  feedback === 'up' 
                    ? 'bg-green-100 text-green-600 ring-2 ring-green-500 ring-offset-2' 
                    : 'bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-600 hover:scale-110'
                }`}
                title="Thumbs Up"
              >
                <ThumbsUp className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setFeedback('down')} 
                className={`p-3 rounded-full transition-all duration-200 ${
                  feedback === 'down' 
                    ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-2' 
                    : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:scale-110'
                }`}
                title="Thumbs Down"
              >
                <ThumbsDown className="w-6 h-6" />
              </button>
            </div>
            {feedback && (
              <span className="text-xs text-indigo-600 font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
                Thanks for your feedback!
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;