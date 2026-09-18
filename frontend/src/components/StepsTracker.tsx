import { SessionStatus } from '../types';
import './StepsTracker.css';

interface StepsTrackerProps {
  status: SessionStatus;
}

export function StepsTracker({ status }: StepsTrackerProps) {
  const isStep1Done = status !== 'created';
  const isStep2Done = ['step1_completed', 'step2_pending', 'step2_completed', 'key_ready'].includes(status);
  const isStep3Done = ['step2_completed', 'key_ready'].includes(status);

  return (
    <div className="steps">
      <div className={`step ${isStep1Done ? 'step-checked' : ''}`}>
        <span className="step-num">{isStep1Done ? '✓' : '1'}</span>
        <span className="step-text">Chọn Loại</span>
      </div>

      <span className="step-arrow">›</span>

      <div className={`step ${isStep2Done ? 'step-checked' : ''}`}>
        <span className="step-num">{isStep2Done ? '✓' : '2'}</span>
        <span className="step-text">Vượt Link 1</span>
      </div>

      <span className="step-arrow">›</span>

      <div className={`step ${isStep3Done ? 'step-checked' : ''}`}>
        <span className="step-num">{isStep3Done ? '✓' : '3'}</span>
        <span className="step-text">Lấy Tại ServerKey</span>
      </div>
    </div>
  );
}
