import PersonForm from '../../../components/PersonForm'

export default function EditPersonPage({ params }: { params: { id: string } }) {
  return <PersonForm mode="edit" personId={parseInt(params.id)} />
}
