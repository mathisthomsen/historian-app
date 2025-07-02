import { use } from 'react';
import PersonForm from '../../../components/PersonForm'

export default function EditPersonPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return <PersonForm mode="edit" personId={parseInt(params.id)} />
}
