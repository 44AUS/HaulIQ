import { useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import EarningsBrain from './EarningsBrain';
import ProfitCalculator from './ProfitCalculator';

export default function Tools() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'brain';

  return (
    <Box sx={{ height: '100%' }}>
      {activeTab === 'brain'      && <EarningsBrain />}
      {activeTab === 'calculator' && <ProfitCalculator />}
    </Box>
  );
}
