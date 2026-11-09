export default function FolderIcon({ color = "amber", small = false }: { color?: string; small?: boolean }) {
  return <span className={"folder-art " + color + (small ? " small" : "")} aria-hidden="true"><span className="folder-back"/><span className="folder-paper"/><span className="folder-front"/><span className="folder-shine"/></span>;
}
