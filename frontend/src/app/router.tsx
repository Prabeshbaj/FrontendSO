import { createBrowserRouter, Navigate } from 'react-router'
import { LoginCallback } from '@/auth/LoginCallback'
import { RequireAuth } from '@/auth/RequireAuth'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ReviewsPage } from '@/pages/reviews/ReviewsPage'
import { AppShell } from '@/theme/components'

export const routes = [
  { path: '/login/callback', element: <LoginCallback /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/reviews" replace /> },
          { path: 'reviews', element: <ReviewsPage /> },
          { path: 'reviews/:reportId', element: <PlaceholderPage title="Review" text="Side-by-side finding and cited page view (FR-14) comes next." /> },
          { path: 'vendors', element: <PlaceholderPage title="Vendors" text="Vendor list and add vendor. Not built yet." /> },
          { path: 'uploads', element: <PlaceholderPage title="Upload report" text="Upload through a presigned S3 URL. Not built yet. Use synthetic PDFs only until O-4 is answered." /> },
          { path: '*', element: <PlaceholderPage title="Page not found" text="Check the address and try again." /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
