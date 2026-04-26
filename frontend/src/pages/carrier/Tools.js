import { useSearchParams } from 'react-router-dom';
import EarningsBrain from './EarningsBrain';
import ProfitCalculator from './ProfitCalculator';

export default function Tools() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'brain';

  return (
    <div style={{ height: '100%' }}>
      {activeTab === 'brain'      && <EarningsBrain />}
      {activeTab === 'calculator' && <ProfitCalculator />}
    </div>
  );
}
