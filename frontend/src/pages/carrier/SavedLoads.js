import { useState, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { loadsApi } from '../../services/api';
import { adaptLoadList } from '../../services/adapters';
import LoadCard from '../../components/carrier/LoadCard';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };

function SkeletonBox({ width, height }) {
  return <div style={{ width, height, backgroundColor: 'var(--ion-color-light)', borderRadius: 4 }} />;
}

export default function SavedLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadsApi.savedList()
      .then(res => setLoads(adaptLoadList(res)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IonIcon name="bookmark-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 26 }} />
          <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--ion-text-color)' }}>Saved Loads</h2>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          {loads.length} loads saved
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...cardStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBox width="60%" height={20} />
              <SkeletonBox width="80%" height={16} />
              <SkeletonBox width="50%" height={16} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.3)', borderRadius: 6, color: '#d32f2f', fontSize: '0.875rem' }}>
          {error}
        </div>
      ) : loads.length === 0 ? (
        <div style={{ ...cardStyle, padding: '80px 0', textAlign: 'center' }}>
          <IonIcon name="bookmark-outline" style={{ fontSize: 48, color: 'var(--ion-color-medium)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--ion-color-medium)' }}>No saved loads yet.</p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>Bookmark loads from the Load Board to track them here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {loads.map(l => (
            <LoadCard key={l.id} load={l} />
          ))}
        </div>
      )}
    </div>
  );
}
