export function usePathname(){const query=new URLSearchParams(window.location.search);return `/${query.get('screen')||'dashboard'}`;}
