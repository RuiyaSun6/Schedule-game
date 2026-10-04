import type { ButtonHTMLAttributes } from 'react';

export default function PixelButton({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`pixel-button ${className}`} type={type} {...props} />;
}
