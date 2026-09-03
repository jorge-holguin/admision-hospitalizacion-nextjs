import * as React from 'react'

interface ImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  priority?: boolean
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
  [key: string]: any
}

export default function Image(props: Readonly<ImageProps>) {
  const {
    src,
    alt,
    className = '',
    fill,
    priority,
    width,
    height,
    style,
    ...rest
  } = props

  const fillStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    : {}

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={{ ...style, ...fillStyle }}
      loading={priority ? 'eager' : 'lazy'}
      {...rest}
    />
  )
}
