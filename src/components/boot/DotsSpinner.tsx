/** Five dots chasing each other in a circle: the classic "please wait" loader. */
export default function DotsSpinner({ size = 40, label }: { size?: number; label?: string }) {
  return (
    <span className="dots-spinner" style={{ width: size, height: size }} role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <i /><i /><i /><i /><i />
    </span>
  );
}
