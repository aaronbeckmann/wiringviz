import { createContext } from 'react';

/** Id of the wire currently hovered (kept alive 3 s after the pointer leaves). */
export const EdgeHoverContext = createContext<string | null>(null);
