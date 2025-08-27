import { lazy } from 'react'

export const routes = [
    { path: '/', Component: lazy(() => import('./pages/Home')) },
    { path: '/places', Component: lazy(() => import('./pages/Places')) },
    { path: '/plans', Component: lazy(() => import('./pages/Plans')) },
    { path: '/community', Component: lazy(() => import('./pages/Community')) },
    { path: '/events', Component: lazy(() => import('./pages/Events')) },
    { path: '/my', Component: lazy(() => import('./pages/My')) },
    { path: '/adult', Component: lazy(() => import('./pages/Adult')) },
]
