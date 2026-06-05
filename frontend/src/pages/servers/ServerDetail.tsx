import { useParams } from 'react-router-dom';

export default function ServerDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Server Detail</h2>
        <p className="text-muted-foreground mt-1">Server ID: {id}</p>
      </div>

      <div className="glass rounded-xl p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Server Details</h3>
        <p className="text-muted-foreground">Detailed server information and metrics will be displayed here.</p>
      </div>
    </div>
  );
}
