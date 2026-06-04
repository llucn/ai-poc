import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';

type Props = { to: string };

export function BackButton({ to }: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="ic-back-btn"
      aria-label="Back"
      onClick={() => navigate(to)}
    >
      <FontAwesomeIcon icon={faArrowLeft} />
    </button>
  );
}
