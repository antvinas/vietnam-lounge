import { useParams } from 'react-router-dom';

export default function MassageDetailPage() {
  const { id } = useParams();
  return <div>Massage Detail Page for ID: {id} (To be implemented)</div>;
}
