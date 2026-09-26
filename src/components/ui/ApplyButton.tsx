import {event} from '@site/src/data/event';

// A real link once event.formUrl is set; until then a disabled button.
export default function ApplyButton() {
  if (!event.formUrl) {
    return (
      <button type="button" className="btn" disabled>
        {event.applyOpensLabel}
      </button>
    );
  }
  return (
    <a className="btn" href={event.formUrl} target="_blank" rel="noopener noreferrer">
      Apply now ↗
    </a>
  );
}
