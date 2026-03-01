import * as React from 'react';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">
            {title}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        {children}
        {footer && (
          <CardFooter className="flex flex-col space-y-4 pt-0">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
