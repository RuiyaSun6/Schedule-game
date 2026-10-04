import type { ReactNode } from 'react';

export type BadgeIconName =
  | 'seedling' | 'target' | 'flame' | 'calendar-check' | 'scale' | 'mountain'
  | 'star-medal' | 'crown' | 'calendar-star' | 'loop' | 'young-tree' | 'mature-tree';

const ink = '#493f38';
const leaf = '#719a68';
const leafLight = '#b8cf87';
const wood = '#795b46';
const gold = '#e5b95e';
const cream = '#fff0be';

// All artwork uses the same 24-pixel grid, with hard edges so it stays legible in a medallion.
const artwork: Record<BadgeIconName, ReactNode> = {
  seedling: <>
    <path d="M11 19V11H13V19Z" fill={wood} />
    <path d="M11 13H8V11H6V9H4V5H8V7H10V9H12V13ZM13 12V9H15V7H17V5H21V9H19V11H16V13H13Z" fill={ink} />
    <path d="M6 7H8V9H10V11H8V9H6ZM15 9H17V7H19V9H17V11H15Z" fill={leafLight} />
    <path d="M5 19H19V21H5Z" fill={wood} />
  </>,
  target: <>
    <path d="M4 7H6V5H8V4H16V5H18V7H20V16H18V18H16V20H8V18H6V16H4Z" fill={ink} />
    <path d="M6 8H8V6H16V8H18V16H16V18H8V16H6Z" fill={cream} />
    <path d="M8 10H10V8H14V10H16V14H14V16H10V14H8Z" fill="#bf755d" />
    <path d="M10 10H14V14H10Z" fill={gold} />
    <path d="M12 11H14V13H12Z M13 10H16V11H13Z M16 7H18V10H16Z M18 5H20V8H18Z" fill={ink} />
    <path d="M18 4H22V6H18Z" fill="#b9d7ca" />
  </>,
  flame: <>
    <path d="M11 2H14V6H16V4H18V8H20V17H18V20H15V22H9V20H6V17H4V12H6V9H8V7H10V4H11Z" fill={ink} />
    <path d="M12 4H13V8H16V7H17V10H19V17H17V19H14V20H10V19H7V16H6V12H8V10H10V7H12Z" fill="#d96e45" />
    <path d="M11 12H13V10H15V13H17V17H15V19H10V17H8V15H10V13H11Z" fill={gold} />
    <path d="M11 16H13V14H14V18H11Z" fill={cream} />
  </>,
  'calendar-check': <>
    <path d="M4 5H20V21H4Z" fill={ink} />
    <path d="M6 9H18V19H6Z" fill={cream} />
    <path d="M6 7H18V9H6Z" fill="#b78372" />
    <path d="M8 3H10V7H8ZM14 3H16V7H14Z" fill={ink} />
    <path d="M8 13H10V15H12V17H14V15H16V13H18V15H16V17H14V19H12V17H10V15H8Z" fill={leaf} />
  </>,
  scale: <>
    <path d="M11 4H13V17H11ZM5 7H19V9H5ZM9 18H15V20H9ZM6 20H18V22H6Z" fill={ink} />
    <path d="M5 9H7V14H5ZM17 9H19V14H17Z" fill={wood} />
    <path d="M2 14H10V16H9V18H3V16H2ZM14 14H22V16H21V18H15V16H14Z" fill={ink} />
    <path d="M4 15H8V17H4ZM16 15H20V17H16Z" fill={gold} />
    <path d="M9 3H15V5H9Z" fill={cream} />
  </>,
  mountain: <>
    <path d="M11 3H13V12H11Z" fill={ink} />
    <path d="M13 3H20V5H18V7H13Z" fill="#c9705c" />
    <path d="M11 7H13V9H15V11H17V13H19V16H21V20H3V18H5V16H7V13H9V10H11Z" fill={ink} />
    <path d="M11 10H13V12H15V14H17V16H19V18H5V17H7V14H9V12H11Z" fill="#8aa6a0" />
    <path d="M11 10H13V12H15V14H13V13H11V15H9V13H11Z" fill={cream} />
    <path d="M5 19H19V20H5Z" fill={wood} />
  </>,
  'star-medal': <>
    <path d="M5 2H10L12 8L14 2H19L16 11H8Z" fill="#8a799b" />
    <path d="M8 2H10L12 8L14 2H16L13 11H11Z" fill="#d9bfd6" />
    <path d="M7 10H17V12H19V20H17V22H7V20H5V12H7Z" fill={ink} />
    <path d="M8 12H16V13H17V19H16V20H8V19H7V13H8Z" fill={gold} />
    <path d="M11 13H13V15H16V17H14V19H10V17H8V15H11Z" fill={cream} />
  </>,
  crown: <>
    <path d="M2 5H5V9H8V6H10V3H14V6H16V9H19V5H22V17H20V21H4V17H2Z" fill={ink} />
    <path d="M4 8H5V11H9V8H10V6H14V8H15V11H19V8H20V17H4Z" fill={gold} />
    <path d="M6 14H18V17H6Z" fill={cream} />
    <path d="M6 18H18V19H6Z" fill="#bb7b58" />
    <path d="M11 10H13V13H11Z" fill="#9a6b96" />
  </>,
  'calendar-star': <>
    <path d="M4 5H20V21H4Z" fill={ink} />
    <path d="M6 9H18V19H6Z" fill={cream} />
    <path d="M6 7H18V9H6Z" fill="#809fa6" />
    <path d="M8 3H10V7H8ZM14 3H16V7H14Z" fill={ink} />
    <path d="M11 10H13V12H16V14H14V17H10V14H8V12H11Z" fill={gold} />
    <path d="M11 12H13V15H11Z" fill={cream} />
  </>,
  loop: <>
    <path d="M7 4H16V6H18V8H20V11H17V9H15V7H8V9H6V11H3V8H5V6H7Z" fill={ink} />
    <path d="M17 6H22V8H20V10H18V12H16V10H14V8H17Z" fill="#8cb4a6" />
    <path d="M4 13H7V15H9V17H16V15H18V13H21V16H19V18H17V20H8V18H6V16H4Z" fill={ink} />
    <path d="M7 12H9V14H11V16H8V18H3V16H5V14H7Z" fill={gold} />
  </>,
  'young-tree': <>
    <path d="M11 12H13V21H11Z" fill={wood} />
    <path d="M9 4H15V6H18V9H20V13H18V15H6V13H4V9H6V6H9Z" fill={ink} />
    <path d="M9 6H15V8H17V10H18V13H6V10H7V8H9Z" fill={leaf} />
    <path d="M9 7H13V9H9ZM14 10H17V12H14ZM7 11H10V13H7Z" fill={leafLight} />
    <path d="M8 21H16V22H8Z" fill={ink} />
  </>,
  'mature-tree': <>
    <path d="M9 12H15V19H17V21H7V19H9Z" fill={wood} />
    <path d="M8 3H16V4H19V6H21V9H22V14H20V16H4V14H2V9H3V6H5V4H8Z" fill={ink} />
    <path d="M8 5H16V6H19V8H20V14H18V15H6V14H4V8H5V6H8Z" fill={leaf} />
    <path d="M7 7H11V9H7ZM13 6H17V8H13ZM5 11H9V13H5ZM15 11H19V13H15Z" fill={leafLight} />
    <path d="M4 20H9V19H11V21H4ZM13 19H15V20H20V21H13Z" fill={ink} />
  </>,
};

export default function BadgeIcon({ name }: { name: BadgeIconName }) {
  return <svg className="badge-art" viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
    {artwork[name]}
  </svg>;
}
