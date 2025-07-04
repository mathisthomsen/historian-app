import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LifeEventForm from '../../app/components/LifeEventForm';

// Mock fetch globally for all tests
beforeAll(() => {
  global.fetch = jest.fn();
});

describe('Life Events UI', () => {
  test('User can add a life event to a person (UI)', async () => {
    // Mock the POST response for creating a life event
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true })
    });

    // Render the form in create mode for personId 123
    render(
      <LifeEventForm
        mode="create"
        personId={123}
        onCloseAction={jest.fn()}
        onSuccessAction={jest.fn()}
        onErrorAction={jest.fn()}
      />
    );

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Titel/i), 'Geburt');
    await userEvent.type(screen.getByLabelText(/Startdatum/i), '1900-01-01');
    await userEvent.type(screen.getByLabelText(/Ort/i), 'Berlin');
    await userEvent.type(screen.getByLabelText(/Beschreibung/i), 'Geburt in Berlin');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /event erstellen/i }));

    // Wait for fetch to be called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/life-events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Geburt'),
        })
      );
    });
  });
}); 