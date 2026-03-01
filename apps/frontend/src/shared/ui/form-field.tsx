import * as React from 'react';
import { type FieldError } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';

interface FormFieldProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label: string;
  error?: FieldError;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && <Label htmlFor={id}>{label}</Label>}
        <Input
          id={id}
          ref={ref}
          className={cn(error ? 'border-destructive' : '', className)}
          {...props}
        />
        {error && (
          <p className="text-xs text-destructive animate-in slide-in-from-top-1">
            {error.message}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
