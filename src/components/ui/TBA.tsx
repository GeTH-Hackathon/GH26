export default function TBA({title = 'To be announced'}: {title?: string}) {
  return <span className="tba" title={title}>TBA</span>;
}
