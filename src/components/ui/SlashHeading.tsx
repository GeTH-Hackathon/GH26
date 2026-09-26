import type {ReactNode} from 'react';

type Props = {children: ReactNode; as?: 'h1' | 'h2'};

// Renders "/ heading." in the site's Swiss heading style.
export default function SlashHeading({children, as: Tag = 'h2'}: Props) {
  return (
    <Tag className="slash-heading">
      <span className="slash" aria-hidden="true">/ </span>
      {children}.
    </Tag>
  );
}
