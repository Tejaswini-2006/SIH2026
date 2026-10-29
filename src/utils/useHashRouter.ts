import { useState, useEffect, useCallback } from 'react';
import { NavSection } from '../components/layout/Sidebar';

export interface RouteState {
  section: NavSection;
  params: Record<string, string>;
}

export function useHashRouter() {
  const parseHash = (): RouteState => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    const [path, queryString] = hash.split('?');
    const validSections: NavSection[] = [
      'overview',
      'institutions',
      'records',
      'submissions',
      'exceptions',
      'risk',
      'cases',
      'reports',
      'audit-trail',
      'settings',
    ];

    const section = (validSections.includes(path as NavSection) ? path : 'overview') as NavSection;
    const params: Record<string, string> = {};

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    return { section, params };
  };

  const [route, setRoute] = useState<RouteState>(parseHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((section: NavSection, newParams?: Record<string, string>) => {
    let newHash = `#/${section}`;
    if (newParams && Object.keys(newParams).length > 0) {
      const searchParams = new URLSearchParams(newParams);
      newHash += `?${searchParams.toString()}`;
    }
    window.location.hash = newHash;
  }, []);

  const updateParams = useCallback((newParams: Record<string, string>) => {
    const current = parseHash();
    const merged = { ...current.params, ...newParams };
    // Remove empty keys
    Object.keys(merged).forEach((k) => {
      if (!merged[k]) delete merged[k];
    });

    let newHash = `#/${current.section}`;
    if (Object.keys(merged).length > 0) {
      const searchParams = new URLSearchParams(merged);
      newHash += `?${searchParams.toString()}`;
    }
    window.location.hash = newHash;
  }, []);

  return {
    section: route.section,
    params: route.params,
    navigate,
    updateParams,
  };
}
