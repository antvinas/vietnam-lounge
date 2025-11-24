import React from 'react';
import { FaHourglassHalf } from 'react-icons/fa';

interface PlaceholderProps {
  title: string;
  message: string;
}

const Placeholder = ({ title, message }: PlaceholderProps) => {
  return (
    <main className="mx-auto max-w-screen-xl px-4 md:px-10 lg:px-20 py-16 lg:py-24">
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-surface rounded-2xl border border-border p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <FaHourglassHalf className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-h1 font-extrabold tracking-tight text-text-main">{title}</h1>
        <p className="mt-4 text-body max-w-xl mx-auto text-text-secondary">
          {message}
        </p>
      </div>
    </main>
  );
};

export default Placeholder;
