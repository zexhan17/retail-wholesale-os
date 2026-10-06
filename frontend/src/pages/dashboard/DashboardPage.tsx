import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
        <p className="text-muted-foreground">
          Dashboard is currently being rewritten to use Shadcn UI.
        </p>
      </div>
    </div>
  );
};
