import { ReactNode } from 'react';

interface MainProps {
  children: ReactNode;
}

const Main = ({ children }: MainProps) => {
  return (
    <main className="container mx-auto p-4">
      {children}
    </main>
  );
};

export default Main; 