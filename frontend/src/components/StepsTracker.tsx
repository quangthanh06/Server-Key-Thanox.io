import { SessionStatus } from '../types';
import './StepsTracker.css';

interface StepsTrackerProps {
  status: SessionStatus;
}

export function StepsTracker({ status }: StepsTrackerProps) {
  const isStep1Done = status !== 'created';
  const isStep2Done = ['step1_completed', 'step2_pending', 'step2_completed', 'key_ready'].includes(status);
  const isStep3Done = ['step2_completed', 'key_ready'].includes(status);
  const isStep4Done = status === 'key_ready';

  const isStep1Active = status === 'created';
  const isStep2Active = status === 'type_selected' || status === 'step1_pending';
  const isStep3Active = status === 'step1_completed' || status === 'step2_pending';
  const isStep4Active = status === 'step2_completed';

  return (
    <div className="pk-steps">
      <div className={`pk-step ${isStep1Done ? 'pk-step-checked' : ''} ${isStep1Active ? 'pk-step-active' : ''}`}>
        <span className="pk-step-num">{isStep1Done ? '✓' : '1'}</span>
        <span className="pk-step-text">Chọn Proxy</span>
      </div>

      <span className="pk-step-arrow">›</span>

      <div className={`pk-step ${isStep2Done ? 'pk-step-checked' : ''} ${isStep2Active ? 'pk-step-active' : ''}`}>
        <span className="pk-step-num">{isStep2Done ? '✓' : '2'}</span>
        <span className="pk-step-text">Link 1</span>
      </div>

      <span className="pk-step-arrow">›</span>

      <div className={`pk-step ${isStep3Done ? 'pk-step-checked' : ''} ${isStep3Active ? 'pk-step-active' : ''}`}>
        <span className="pk-step-num">{isStep3Done ? '✓' : '3'}</span>
        <span className="pk-step-text">ServerKey</span>
      </div>

      <span className="pk-step-arrow">›</span>

      <div className={`pk-step ${isStep4Done ? 'pk-step-checked' : ''} ${isStep4Active ? 'pk-step-active' : ''}`}>
        <span className="pk-step-num">{isStep4Done ? '✓' : '4'}</span>
        <span className="pk-step-text">Nhận Key</span>
      </div>
    </div>
  );
}
