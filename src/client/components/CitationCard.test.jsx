import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import CitationCard from './CitationCard';

// Mock Tooltip and AbstractView to simplify component testing
vi.mock('./Tooltip', () => ({
  default: ({ children }) => <div>{children}</div>
}));

vi.mock('./AbstractView', () => ({
  default: ({ text }) => <div>{text}</div>
}));

// Mock language detection
vi.mock('../utils/languageDetection', () => ({
  getActiveLanguage: () => 'en'
}));

describe('CitationCard', () => {
  const mockArticle = {
    pmid: '12345678',
    title: 'Test Article Title',
    authors: ['Author One', 'Author Two'],
    journal: 'Test Journal',
    pubDate: '2023-01-01',
    abstract: 'This is a test abstract.'
  };

  it('renders the article title', () => {
    render(<CitationCard article={mockArticle} />);
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('renders authors joined by comma', () => {
    render(<CitationCard article={mockArticle} />);
    expect(screen.getByText('Author One, Author Two')).toBeInTheDocument();
  });

  it('renders journal and date', () => {
    render(<CitationCard article={mockArticle} />);
    expect(screen.getByText(/Test Journal/)).toBeInTheDocument();
    expect(screen.getByText(/2023-01-01/)).toBeInTheDocument();
  });

  it('renders a link to PubMed', () => {
    render(<CitationCard article={mockArticle} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/12345678/');
  });
});
