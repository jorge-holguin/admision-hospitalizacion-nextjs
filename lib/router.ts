import { useNavigate, useLocation, useParams } from 'react-router-dom'

export { Link, useSearchParams } from 'react-router-dom'
export { useParams }

export function useRouter() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    pathname: location.pathname,
    query: params,
    asPath: location.pathname + location.search,
    refresh: () => window.location.reload(),
  }
}
