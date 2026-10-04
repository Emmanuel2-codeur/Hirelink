import { useEffect, useState } from 'react';
// true si la requête média correspond (ex. '(min-width: 1024px)') ; sert à ne monter qu'UNE mise en page à la fois.
export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on(); m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}
