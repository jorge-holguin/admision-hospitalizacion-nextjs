"use client";

import React, { useState } from 'react';
import Image from '@/components/Image';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface ImageWithLoaderProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'className' | 'src' | 'alt'> {
  src: string
  alt: string
  priority?: boolean
  loadedClassName?: string;
  loadingClassName?: string;
  className?: string;
  transitionDuration?: number;
}

export default function ImageWithLoader({
  src,
  alt,
  priority,
  loadedClassName,
  loadingClassName,
  className,
  transitionDuration = 300,
  ...props
}: ImageWithLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  if (hasError) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        <User className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      className={cn(
        'transition-opacity duration-300 ease-in-out',
        className,
        isLoaded 
          ? cn('opacity-100', loadedClassName) 
          : cn('opacity-0', loadingClassName)
      )}
      style={{ 
        transitionDuration: `${transitionDuration}ms` 
      }}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
}
