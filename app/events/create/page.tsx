'use client';

import { useParams } from 'next/navigation';
import EventForm from '../../components/EventForm';

export default function EditEventPage() {
  const { id } = useParams();
  const eventId = Number(id);

  return <EventForm mode="create" eventId={eventId} />;
}