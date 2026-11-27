import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '@/auth/AuthProvider'
import { routes } from '@/app/router'

function renderAt(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <AuthProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>,
  )
  return router
}

describe('ReviewsPage', () => {
  it('lists synthetic reviews with pagination', async () => {
    renderAt('/reviews')
    expect(await screen.findByRole('heading', { name: 'Reviews' })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Review search results' })
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBe(21)) // header + 20
    expect(screen.getByText(/1–20 of 64/)).toBeInTheDocument()
  })

  it('debounces the search box into the URL and filters results', async () => {
    const user = userEvent.setup()
    const router = renderAt('/reviews')
    const box = await screen.findByRole('searchbox', { name: 'Search vendor or system' })
    await user.type(box, 'bluefin')
    await waitFor(() => expect(router.state.location.search).toBe('?q=bluefin'))
    const table = screen.getByRole('table', { name: 'Review search results' })
    await waitFor(() => {
      const links = within(table).getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      links.forEach((l) => expect(l).toHaveTextContent('Bluefin Payroll'))
    })
  })

  it('sorts by vendor when the header is pressed', async () => {
    const user = userEvent.setup()
    const router = renderAt('/reviews')
    await user.click(await screen.findByRole('button', { name: /Vendor/ }))
    await waitFor(() => expect(router.state.location.search).toBe('?sort=vendorName&dir=asc'))
    expect(screen.getByRole('columnheader', { name: /Vendor/ })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('shows an error with retry when the API fails', async () => {
    const { server } = await import('@/test/setup')
    const { http, HttpResponse } = await import('msw')
    server.use(http.get('*/api/reviews', () => HttpResponse.json({ message: 'boom' }, { status: 500 })))
    renderAt('/reviews')
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load reviews')
  })
})
