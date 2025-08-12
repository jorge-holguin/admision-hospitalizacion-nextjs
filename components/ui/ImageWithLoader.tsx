"use client";

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface ImageWithLoaderProps extends Omit<ImageProps, 'className'> {
  /**
   * Clase CSS a aplicar cuando la imagen está cargada
   */
  loadedClassName?: string;
  
  /**
   * Clase CSS a aplicar mientras la imagen está cargando
   */
  loadingClassName?: string;
  
  /**
   * Clase CSS base que se aplica siempre
   */
  className?: string;
  
  /**
   * Duración de la transición en milisegundos
   * @default 300
   */
  transitionDuration?: number;
}

/**
 * Componente que muestra una imagen con efecto de transición al cargar
 */
export default function ImageWithLoader({
  src,
  alt,
  loadedClassName,
  loadingClassName,
  className,
  transitionDuration = 300,
  ...props
}: ImageWithLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Manejar el evento de carga completada
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  return (
    <Image
      src={src}
      alt={alt}
      className={cn(
        // Clases base que siempre se aplican
        'transition-opacity duration-300 ease-in-out',
        // Clase personalizada base
        className,
        // Clases condicionales según el estado de carga
        isLoaded 
          ? cn('opacity-100', loadedClassName) 
          : cn('opacity-0', loadingClassName)
      )}
      style={{ 
        transitionDuration: `${transitionDuration}ms` 
      }}
      onLoad={handleLoad}
      {...props}
    />
  );
}
