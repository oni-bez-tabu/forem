// Wrapper na pojedynczy wpis timeline'u. Renderuje kolorową kropkę
// z białym ringiem + pionową linię łączącą do następnego wpisu, oraz
// kartę zawartości po prawej. Mirror oryginalnego ERB
// (_timeline_feed.html.erb) który wyglądał 1:1 z hifi mockup E8.
import { h } from 'preact';
import PropTypes from 'prop-types';
import { dotHex } from './theme';

export const TimelineItem = ({ dotType, isLast, children }) => {
  return (
    <li
      style={{
        position: 'relative',
        padding: '0 0 16px 28px',
        listStyle: 'none',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '8px',
          top: '18px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: dotHex(dotType),
          boxShadow: '0 0 0 3px var(--card-bg, #fff)',
        }}
      />
      {!isLast && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '12px',
            top: '28px',
            bottom: '-4px',
            width: '2px',
            background: 'var(--card-border, #e5e5e5)',
          }}
        />
      )}
      {children}
    </li>
  );
};

TimelineItem.propTypes = {
  dotType: PropTypes.string.isRequired,
  isLast: PropTypes.bool,
  children: PropTypes.node,
};
